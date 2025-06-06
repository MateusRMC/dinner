"use client";

import React, { useState } from 'react';

export default function OrderForm({insertOrder, fetchMenu, menuList}) {

const [dishOption, setDishOption] = useState("");

  return (
    <form onSubmit={insertOrder} className="controls">
        {menuList.map((dish) => (
          <label key={dish.id} className='dishOptions'><span>{dish.name}</span><input type="radio" name={dish.id} /></label>
        ))}
        <br />
      <button type="submit">Pedir</button>
    </form>
  )
}

