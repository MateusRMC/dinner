"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import GuestForm from "./components/GuestForm";
import OrderForm from "./components/OrderForm";

export default function Homepage() {
  const [guestName, setGuestName] = useState("");
  const [guestList, setGuestList] = useState([]);
  const [guestStatus, setGuestStatus] = useState("Still picking");
  const [loggedGuestName, setLoggedGuestName] = useState("");
  const [loggedGuestId, setLoggedGuestId] = useState("");
  const [menuList, setMenuList] = useState([]);

  useEffect(() => {
    !loggedGuestId && setLoggedGuestId(localStorage.getItem("guestId"));
  });

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

  async function insertGuest(e) {
    e.preventDefault();

    const { data, error } = await supabase
      .from("guests")
      .insert([{ name: guestName }])
      .select();

    if (error) {
      console.error("não inseriu porque:", error);
    } else if (data && data.length > 0) {
      const guest = data[0];

      localStorage.setItem("guestId", guest.id); // armazena o ID
      localStorage.setItem("guestName", guest.name); // armazena o nome, se quiser manter

      setLoggedGuestName(guest.name);
      setLoggedGuestId(guest.id);

      setGuestName("");
    }
  }

  async function logOutGuest() {
    const { data, error } = await supabase
      .from("guests")
      .delete()
      .eq("id", loggedGuestId);

    if (error) {
      return;
    }

    localStorage.removeItem("guestId");
    localStorage.removeItem("guestName");

    setLoggedGuestId("");
    setLoggedGuestName("");
  }

  async function fetchMenu() {
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("erro no menu: ", error);
    } else {
      setMenuList(data);
    }
  }

  async function insertOrder(e) {
    e.preventDefault();

    // cenas para os próximos capitulos - const {data, error} = await supabase.from("orders").insert{[ ""]}
  }

  useEffect(() => {
    fetchGuest();

    fetchMenu();

    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container">
      <div className="panel">
        <h2 className="panel-title">
          {guestList.length > 0
            ? "🍽️ Guests at your table"
            : "No guests at your table"}
        </h2>
        {guestList.map((guest) => (
          <div key={guest.id} className="guestDiv">
            <p className="guestName">
              {guest.name}
              {guest.id == localStorage.getItem("guestId") && " (You)"}
            </p>
            <span className="guestStatus">{guestStatus}</span>
          </div>
        ))}
      </div>
      {loggedGuestId ? (
        <OrderForm
          menuList={menuList}
          insertOrder={insertOrder}
          fetchMenu={fetchMenu}
          logOutGuest={logOutGuest}
          loggedGuestId={loggedGuestId}
        />
      ) : (
        <GuestForm
          guestName={guestName}
          setGuestName={setGuestName}
          insertGuest={insertGuest}
        />
      )}
    </div>
  );
}
