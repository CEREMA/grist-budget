import { useEffect, useState } from "react";
import PreviewComponent from "../components/previsionnel.js";

const sample = {}
//import sample from "../tmp/sample2.json";

export default function PreviewPage() {
  const [data, setData] = useState();
  useEffect(() => {
    setData(sample);
  }, []);

  return (
    <PreviewComponent data={data} />
  );
}
