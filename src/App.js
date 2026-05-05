import React, { useState, useEffect, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { motion, AnimatePresence } from "framer-motion";

import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");

  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");
  const [data, setData] = useState([]);

  const [goal, setGoal] = useState("");
  const [reward, setReward] = useState("");

  const [streak, setStreak] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState(null);

  const [loaded, setLoaded] = useState(false);

  const cardRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("studyData");
    if (saved) setData(JSON.parse(saved));

    const savedStreak = localStorage.getItem("streak");
    const savedDate = localStorage.getItem("lastStudyDate");

    if (savedStreak !== null) setStreak(parseInt(savedStreak));
    if (savedDate !== null) setLastStudyDate(savedDate);

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem("studyData", JSON.stringify(data));
    }
  }, [data]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem("streak", streak);
    if (lastStudyDate) {
      localStorage.setItem("lastStudyDate", lastStudyDate);
    }
  }, [streak, lastStudyDate, loaded]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.transform = `
      rotateX(${-(y - rect.height / 2) / 25}deg)
      rotateY(${(x - rect.width / 2) / 25}deg)
      scale(1.03)
    `;
  };

  const resetTilt = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  const addStudy = () => {
    if (!subject || !time) return;

    setData([...data, { subject, time: parseFloat(time) }]);

    const todayDate = new Date();

    // ✅ CHANGE 1: better date format
    const today = todayDate.toISOString().split("T")[0];

    if (lastStudyDate) {
      const last = new Date(lastStudyDate);

      const todayMid = new Date(
        todayDate.getFullYear(),
        todayDate.getMonth(),
        todayDate.getDate()
      );

      const lastMid = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate()
      );

      const diffDays = (todayMid - lastMid) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        setStreak((prev) => prev + 1);
      } else if (diffDays > 1) {   // ✅ CHANGE 2: safer reset
        setStreak(1);
      }
    } else {
      setStreak(1);
    }

    setLastStudyDate(today);

          // 🎯 REWARD SYSTEM

      let msg = `+${time} hrs added ⚡`;

      if (streak >= 5) {
        msg = "👑 You're on fire!";
      } else if (streak >= 3) {
        msg = "🔥 Streak growing!";
      }

      if (goal > 0 && totalHours + parseFloat(time) >= goal) {
        msg = "🎉 Goal achieved!";
      }

      setReward(msg);

      // auto remove after 3 sec
      setTimeout(() => setReward(""), 3000);

    setSubject("");
    setTime("");
  };

  const deleteItem = (i) => {
    setData(data.filter((_, index) => index !== i));
  };

  const totalHours = data.reduce((a, b) => a + b.time, 0);
  let insight = "";

if (data.length === 0) {
  insight = "🚀 Start studying to build your streak!";
} else if (goal > 0 && totalHours >= goal) {
  insight = "🔥 You smashed your goal!";
} else if (goal > 0 && totalHours < goal) {
  insight = "⚠️ You're below your goal, push a bit more!";
} else if (totalHours > 3) {
  insight = "📈 You're doing great today!";
} else {
  insight = "😴 Try to study a bit more consistently";
}

  const progress =
    goal > 0 ? Math.min((totalHours / parseFloat(goal)) * 100, 100) : 0;

  const progressColor =
    progress < 33
      ? "#ef4444"
      : progress < 66
      ? "#facc15"
      : progress < 100
      ? "#22d3ee"
      : "#22c55e";

  const chartData = {
    labels: data.map((d) => d.subject),
    datasets: [
      {
        label: "Study Hours",
        data: data.map((d) => d.time),
        backgroundColor: ["#00f5ff", "#4ade80", "#facc15"],
        borderRadius: 12,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: { ticks: { color: "#ffffff" } },
      y: { ticks: { color: "#ffffff" } },
    },
  };

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  const handleAuth = async () => {
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("✨ Account Created!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("🚀 Welcome Back!");
      }
    } catch (err) {
      setMessage("❌ " + err.message.split("/")[1]?.replace(")", ""));
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = () => {
    signOut(auth);
    setMessage("👋 Logged out");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617]" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 backdrop-blur-xl shadow-[0_0_60px_rgba(0,150,255,0.5)] p-6 rounded-2xl w-80"
        >
          <h2 className="text-center text-xl mb-4">
            {isSignup ? "Create Account" : "Login"}
          </h2>

          <input
            className="w-full p-2 mb-3 rounded bg-white/10"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full p-2 mb-3 rounded bg-white/10"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0px 0px 25px #00f5ff" }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAuth}
            className="w-full py-2 rounded bg-gradient-to-r from-cyan-400 to-blue-500 text-black"
          >
            {isSignup ? "Signup" : "Login"}
          </motion.button>

          <p
            onClick={() => setIsSignup(!isSignup)}
            className="text-center mt-3 cursor-pointer text-sm hover:underline"
          >
            {isSignup ? "Already have account?" : "New user? Signup"}
          </p>
        </motion.div>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-5 bg-black/70 px-4 py-2 rounded-lg text-cyan-300"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617]" />

      <Particles
        init={particlesInit}
        className="absolute inset-0"
        options={{
          particles: {
            number: { value: 80 },
            move: { enable: true, speed: 0.5 },
            links: { enable: true, color: "#00f5ff" },
          },
        }}
      />

      <motion.button
        whileHover={{ scale: 1.2, boxShadow: "0px 0px 25px #ff4d4d" }}
        whileTap={{ scale: 0.9 }}
        onClick={handleLogout}
        className="absolute top-5 right-5 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-red-400 text-red-400 font-semibold"
      >
        ⏻ Logout
      </motion.button>

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="bg-white/5 backdrop-blur-xl shadow-[0_0_60px_rgba(0,150,255,0.3)] p-6 rounded-3xl w-full max-w-md"
      >

        <motion.h1
          whileHover={{ scale: 1.1, textShadow: "0px 0px 20px #00f5ff" }}
          className="text-2xl text-white text-center mb-4"
        >
          Smart Study Assistant 🚀
        </motion.h1>

        <motion.div 
  className="flex items-center justify-center gap-2 mb-3"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>

  {/* 🔥 ICON — SMOOTH BREATHING GLOW */}
  <motion.span
    animate={{
      filter: [
        "drop-shadow(0 0 2px #ff7a00)",
        "drop-shadow(0 0 8px #ff7a00)",
        "drop-shadow(0 0 2px #ff7a00)",
      ],
      y: [0, -1, 0], // tiny float (almost invisible)
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className="text-lg"
  >
    🔥
  </motion.span>

  {/* ⚡ TEXT — CLEAN FADE + SLIDE */}
  <motion.span
  key={streak}
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
  className="text-sm text-orange-300 font-medium tracking-wide"
>
  {streak} {streak === 1 ? "Day" : "Days"} Streak
</motion.span>

</motion.div>
<p className="text-cyan-300 text-xs mb-3 text-center">
  {insight}
</p>

{/* 🔥 ADD STEP 3 EXACTLY HERE */}
<AnimatePresence>
  {reward && (
    <motion.div
      initial={{ y: -20, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center text-cyan-300 text-xs mb-2"
    >
      {reward}
    </motion.div>
  )}
</AnimatePresence>

{/* 👇 existing input section */}
<div className="flex gap-2 mb-4"></div>

        <div className="flex gap-2 mb-4">
          <motion.input
            whileHover={{ scale: 1.08 }}
            className="p-2 rounded bg-white/10 text-white w-full"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <motion.input
            whileHover={{ scale: 1.08 }}
            className="p-2 rounded bg-white/10 text-white w-20"
            placeholder="Hrs"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <motion.button
            whileHover={{ scale: 1.2, boxShadow: "0px 0px 20px #00f5ff" }}
            whileTap={{ scale: 0.9 }}
            onClick={addStudy}
            className="px-4 py-2 rounded bg-cyan-400 text-black"
          >
            Add
          </motion.button>
        </div>

        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Set Goal (hrs)"
          className="w-full p-2 rounded bg-white/10 text-white mb-2"
        />

        <p className="text-white text-sm mb-1">
          Progress: {progress.toFixed(2)}%
        </p>

        <div className="w-full h-2 bg-white/10 rounded mb-3">
          <div
            className="h-full rounded"
            style={{
              width: `${progress}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>

        {progress >= 100 && (
          <p className="text-green-400 text-sm mb-2">
            🎉 Goal Achieved!
          </p>
        )}

        <motion.p className="text-white mb-2 text-sm">
          Total Hours: {totalHours}
        </motion.p>

        <ul className="text-white mb-4">
          {data.map((item, i) => (
            <motion.li
              key={i}
              whileHover={{ scale: 1.05 }}
              className="flex justify-between bg-white/10 px-3 py-2 rounded mb-2"
            >
              {item.subject} - {item.time} hrs
              <button onClick={() => deleteItem(i)}>✖</button>
            </motion.li>
          ))}
        </ul>

        {data.length > 0 && <Bar data={chartData} options={chartOptions} />}
      </motion.div>
    </div>
  );
}

export default App;