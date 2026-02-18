import { EXERCISE_DATA } from "@/constants/exerciseData";
import RecordClient from "./RecordClient";

export async function generateStaticParams() {
  return Object.keys(EXERCISE_DATA).map((id) => ({
    id: id.toString(),
  }));
}

export default function RecordPage() {
  return <RecordClient />;
}
