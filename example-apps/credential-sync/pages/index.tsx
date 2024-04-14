import { useState } from "react";

import { TEST_USER_ID } from "../constants";

export default function Index() {
  const [data, setData] = useState("");
  async function updateToken({ invalid } = { invalid: false }) {
    const res = await fetch(`/api/setTokenInCalCom?invalid=${invalid ? 1 : 0}&userId=${TEST_USER_ID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    setData(JSON.stringify(data));
  }
  return (
    <div>
      <button onClick={() => updateToken({ invalid: true })}>Update Invalid Token in Cal.com</button>
      <button onClick={() => updateToken()}>Update token in Cal.com</button>

      <div>{data}</div>
    </div>
  );
}
