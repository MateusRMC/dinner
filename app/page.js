"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Homepage() {
  const [guestName, setGuestName] = useState("");
  const [guestList, setGuestList] = useState([]);

  async function fetchGuest() {
    //isso aqui é a consulta ao banco de dados em si
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Deu ruim:", error);
    } else {
      setGuestList(data);
    }
  }

  async function InsertGuest(e) {
    e.preventDefault();

    const { data, error } = await supabase
      .from("guests")
      .insert([{ name: guestName }]);

    if (error) {
      console.error("não inseriu porque:", error);
    } else {
      setGuestName("");
    }
  }

  useEffect(() => {
    fetchGuest();

    const channel = supabase // isso aqui é a ativação do realtime pra aquela consulta lá em cima ser em tempo real (e não uma consulta em si)
      .channel("realtime_guests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setGuestList((guestList) => [...guestList, payload.new]);
          }

          if (payload.eventType === "DELETE") {
            setGuestList((guestList) =>
              guestList.filter((g) => g.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  }, []);

  return (
    <div className="container">
      <div className="panel">
        {guestList.map((guest) => (
          <h1 key={guest.id}>{guest.name}</h1>
        ))}
      </div>
      <form onSubmit={InsertGuest} className="controls">
        <input
          type="text"
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="What's your name?"
          value={guestName}
        />
        <button type="submit">join dinner</button>
      </form>
    </div>
  );
}
