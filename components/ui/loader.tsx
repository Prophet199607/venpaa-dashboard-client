"use client";

export default function Loader() {
  return (
    <>
      <style>
        {`
          .spinner-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }

          .spinner {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 9px solid;
            border-color: #dbdcef;
            border-right-color: #000000;
            animation: spinner-d3wgkg 1s infinite linear;
          }

          @keyframes spinner-d3wgkg {
            to {
              transform: rotate(1turn);
            }
          }
        `}
      </style>
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    </>
  );
}
