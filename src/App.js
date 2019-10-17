import React, { useState, useEffect } from "react";
import Chart from './components/charts/Tick_Chart.js'
import { csv } from 'd3-fetch'

function App() {
  const [files, setfiles] = useState([]);
  const [symbol, setsymbol] = useState({});
  const [data, setData] = useState({});

  useEffect(() => {
    fetch("http://localhost:55555/").then(files => {
      console.log({ files });
      files.json().then(data => setfiles(data));
    });
  }, []);

  useEffect(() => console.log(data));

  const getData = async name => {
    setData({ ...data, [name]: await fetchData(name), symbol:name });
  };

  return (
    <>
      <div>I work</div>
      {/* <Ticker_Chart data={data}/> */}
      <div>
        {/* TODO make nice list of Symbols */}
        {files.map((file_name, index) => {
          const name = file_name.slice(0, -".csv".length);

          return <button key={index} onClick={() => getData(file_name)}>{name}</button>;
        })}

        <Chart 
          data={data[data.symbol]}
        />
      </div>
    </>
  );
}

export default App;

async function fetchData(file_name) {
  let csvData = await csv(`http://localhost:55555/${file_name}`);
  return csvData;
}
