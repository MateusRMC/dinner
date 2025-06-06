import React from 'react'

export default function GuestForm({insertGuest, setGuestName, guestName}) {
  return (
     <form onSubmit={insertGuest} className="controls">
        <input
          type="text"
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="What's your name?"
          value={guestName}
          required
        />
        <button type="submit">Join dinner</button>
      </form>
  )
}