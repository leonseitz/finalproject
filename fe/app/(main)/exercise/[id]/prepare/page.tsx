import { EXERCISE_DATA } from "@/constants/exerciseData";
import PrepareClient from "./PrepareClient";

export async function generateStaticParams() {
  return Object.keys(EXERCISE_DATA).map((id) => ({
    id: id.toString(),
  }));
}

export default function PreparePage() {
  return <PrepareClient />;
}
