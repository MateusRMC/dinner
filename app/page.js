"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import GuestForm from "./components/GuestForm";
import OrderForm from "./components/OrderForm";

export default function Homepage() {
  const [guestName, setGuestName] = useState("");
  const [guestList, setGuestList] = useState([]);
  const [orderName, setOrderName] = useState({});
  const [orderStatus, setOrderStatus] = useState({});
  const [loggedGuestName, setLoggedGuestName] = useState("");
  const [loggedGuestId, setLoggedGuestId] = useState("");
  const [menuList, setMenuList] = useState([]);

  useEffect(() => {
    //verificação de usuário logado antes de qualquer coisa
    if (!loggedGuestId) {
      setLoggedGuestId(localStorage.getItem("guestId"));
    }
  }, [loggedGuestId]);

  async function fetchGuest() {
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

  async function fetchOrder() {
    const { data, error } = await supabase
      .from("orders")
      .select("id, guest_id, dish_id, menu(name), order_status")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return;
    }

    if (data) {
      //pegando nome dos pedidos de cada guest
      const orderNameMap = {};
      data.forEach((order) => {
        orderNameMap[order.guest_id] = order.menu?.name;
      });
      setOrderName(orderNameMap);
    }

    if (data) {
      //pegando o status do pedido de cada guest
      const orderStatusMap = {};
      data.forEach((order) => {
        orderStatusMap[order.guest_id] = order.order_status;
      });
      setOrderStatus(orderStatusMap);
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

      localStorage.setItem("guestId", guest.id);
      localStorage.setItem("guestName", guest.name);

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

    console.log("usuário removido");

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

  async function insertOrder(pickedDish) {
    const { data, error } = await supabase
      .from("orders")
      .insert([{ guest_id: loggedGuestId, dish_id: pickedDish }])
      .select();

    if (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchGuest();
    fetchMenu();
    fetchOrder();

    const guestChannel = supabase
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

    const orderChannel = supabase
      .channel("realtime_orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrder();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(guestChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  return (
    <div className="container">
      <div className="panel">
        <p className="panel-title">
          {guestList.length > 0
            ? "🍽️ Guests at your table"
            : "No guests at your table"}
        </p>
        {guestList.map((guest) => (
          <div key={guest.id} className="guestDiv">
            <p className="guestName">
              {guest.name}
              {guest.id == localStorage.getItem("guestId") && " (You)"}
            </p>
            <span className="orderName">
              {orderName[guest.id] || "Still picking"}
            </span>
            <span className="orderStatus">{orderStatus[guest.id] || ""}</span>
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
