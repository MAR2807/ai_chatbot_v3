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


const words = ["Assistant", "Chatbot", "Friend", "Helper", "Advisor"];
const animatedHeader = "Hello I am Travell, your Personal";



export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userID, setUserID] = useState("");
  const [data, setData] = useState<Message[]>([]);
  const [claude3response, setClaude3response] = useState("");


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


  const fetchClaude3Response = async (newMessage: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if(!apiUrl) {
      console.error("API URL not found");
      throw new Error("API URL not found");
    }
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newmessage: newMessage })
      });
      const data = await response.json();
      setClaude3response(data.response);
      console.log(data.response);
      return data.response;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

 
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


   
    return () => querySnapshot();
  }, []);




  const sendMessage = async (newMessage: string) => {
 
    try {
      await addDoc(collection(db, 'user-messages'), { text: newMessage, timestamp: Timestamp.now(), origin: "user", userID: userID });
      const claude3response= await fetchClaude3Response(newMessage);
      await addDoc(collection(db, 'user-messages'), { text: claude3response, timestamp: Timestamp.now(), origin: "chatbot",  userID: userID });

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



  const handleLogOut = () =>{
    signOut(auth).then(() => {
      Router.push('/login');
    }).catch((error) => {
      console.error("Error signing out:", error);
    });


  }

 
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
