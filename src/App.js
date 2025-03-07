import React from "react";
import "../src/components/styles.css";
import { RouterProvider } from "react-router-dom";
import { router } from './route/router';

function App() {
  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
