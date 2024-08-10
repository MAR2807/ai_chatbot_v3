'use client'


import WordRotate from "./components/WordRotate";
import TypingAnimation from "./components/TypingAnimation";
import { useRouter } from 'next/navigation';
import ShimmerButton from "./components/ShimmerButton";
import DotPattern from "./components/DotPattern";
import { use, useEffect, useState } from "react";
import { cn } from "./lib/utils";
import openAI from "openai";
import { app, db, auth } from './firebase';
import { collection, getDocs, Timestamp, addDoc, onSnapshot, query} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";


import * as dotenv from "dotenv";
dotenv.config();


//TO DO:
//Add user ID and login functions
// differentiate each user's messages by implementing user ID into the api call and to retrieve messages




const words = ["Assistant", "Chatbot", "Friend", "Helper", "Advisor"];
const animatedHeader = "Hello I am Travell, your Personal";


if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  console.error("Error: The OPENAI_API_KEY environment variable is missing or empty.");
}
//HIDE KEY WHEN DONE
const openai = new openAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser:true });
//HIDE KEY WHEN DONE




const systemPrompt =`
You are an AI assistant for a
travel app designed to enhance users' travel experiences by providing personalized suggestions based on their preferences and interests. Here are the functionalities and details you should consider when interacting with users and providing recommendations:


User Input:


Collect data about the travel destination, number of people in the group, and their interests and hobbies.
Data Gathering:


Gather comprehensive information about the surrounding area of the travel destination, including:
Restaurants
Landmarks
Parks
Attractions
Personalized Recommendations:


Utilize AI to analyze the travel group's interests and hobbies.
Display suggestions for restaurants and attractions that align with these interests.
Each suggestion should include:
Distance from the user's location
Opening and closing times
Additional relevant details (e.g., type of cuisine, special features of landmarks, etc.)
Daily Trip Planning:


Create a daily trip plan for the user, incorporating suggested activities and places to visit.
Ensure the trip plan is well-organized and takes into account the opening and closing times of each suggested location.
Provide options to customize the trip plan based on user feedback.
Your goal is to make travel planning seamless and enjoyable for users by providing highly relevant and useful suggestions, ensuring that their travel experience is tailored to their preferences.
`;






async function getOpenAIResponse(message: string): Promise<string> {


 
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });
    console.log(response);
    // Extract the content from the response
    const content = response.choices[0].message.content ?? "No response from OpenAI.";
    return content;
  } catch (error) {
    console.log(error);
    return "Error fetching response from OpenAI.";
  }
}












export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userID, setUserID] = useState("");
  const [data, setData] = useState<Message[]>([]);


  const Router = useRouter();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setUserID(user.uid);
      } else {
        setUser(null);
        Router.push('/login'); // Redirect to login page if not authenticated
      }
    });


    return () => unsubscribe();
  }, [Router]);


 
  interface Message {
    id: string;
    text: string;
    timestamp: {
      seconds: number;
      nanoseconds: number;
    };
    origin: string;
    userID: string;
  }




  useEffect(() => {
    const querySnapshot = onSnapshot(collection(db, 'user-messages'), (querySnapshot) => {
      const messages: Message[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setData(messages);
    });


    // Cleanup the listener on component unmount
    return () => querySnapshot();
  }, []);


  const sendMessage = async (newMessage: string) => {
 
    try {
      await addDoc(collection(db, 'user-messages'), { text: newMessage, timestamp: Timestamp.now(), origin: "user", userID: userID });
 
      const apiResponse = await getOpenAIResponse(newMessage);
      await addDoc(collection(db, 'user-messages'), { text: apiResponse, timestamp: Timestamp.now(), origin: "chatbot",  userID: userID });
    } catch (error) {
      console.error("Error fetching response from OpenAI:", error);
    }
  };


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue(""); // Clear the input after sending the message
    }
  };


  const handleLoginNavigate = () => {
    Router.push("./login");
  }


  const handleLogOut = () =>{
    signOut(auth).then(() => {
      Router.push('/login');
    }).catch((error) => {
      console.error("Error signing out:", error);
    });


  }






  // const leftMessages = combinedMessages.filter(message => messages.includes(message));
  // const rightMessages = combinedMessages.filter(message => initialMessages.includes(message));
 
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <DotPattern
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        )}
      />


      <div style={{ marginTop: "-25px" }}>
        <ShimmerButton onClick={handleLogOut}>
          <h3 style={{ color: "white" }}>LogOut</h3>
        </ShimmerButton>
      </div>


      <div style={{ marginTop: "50px", position: "absolute" }}>
        <TypingAnimation
          className="text-4xl font-bold text-black dark:text-white"
          text={animatedHeader}
        />


        <div
          className="text-5xl font-semibold text-center my-12"
          style={{ marginTop: "20px", position: "relative" }}
        >
          <WordRotate words={words} />
        </div>
      </div>


      <div
        style={{
          border: "0px solid black",
          backgroundColor: "transparent",
          marginTop: "150px",
          width: "600px",
          height: "500px",
          paddingTop: "100px",
          scrollbarColor: "transparent transparent",
        }}
        className="relative flex h-[500px] w-full flex-col items-center justify-start overflow-auto rounded-lg border bg-background md:shadow-xl"
      >
        {data.length > 0 ? (
          data
            .filter((message) => message.userID === user?.uid)
            .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)
            .map((message, index) => (
              <div
                key={index}
                style={{
                  maxWidth: "200px",
                  border:
                    message.origin == "chatbot"
                      ? "1px solid grey "
                      : "1px solid blue",
                  padding: "10px",
                  margin: "10px 20px",
                  borderRadius: "5px",
                  fontSize: "12px",
                  alignSelf:
                    message.origin == "chatbot" ? "flex-start" : "flex-end",
                }}
              >
                {message.origin == "chatbot" && (
                  <div>
                    Origin: {message.origin}
                    <p>{message.text}</p>
                    <small>
                      {new Date(
                        message.timestamp.seconds * 1000
                      ).toLocaleString()}
                    </small>
                  </div>
                )}


                {message.origin == "user" && (
                  <div>
                    Origin: {message.origin}
                    <p>{message.text}</p>
                    <small>
                      {new Date(
                        message.timestamp.seconds * 1000
                      ).toLocaleString()}
                    </small>
                  </div>
                )}
              </div>
            ))
        ) : (
          <p>Loading...</p>
        )}
      </div>


      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "50px",
          marginBottom: "20px",
          color: "black",
          width: "500px",
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ borderRadius: "20px", width: "100%" }}
        />
        <button type="submit" style={{ display: "none" }}>
          Send
        </button>
      </form>


      <ShimmerButton className="shadow-2xl" onClick={handleSubmit}>
        <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
          Send
        </span>
      </ShimmerButton>
    </main>
  );
}
