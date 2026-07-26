import Head from "next/head";
import PatientForm from "../components/PatientForm";

export default function PatientPage() {
  return (
    <>
      <Head>
        <title>Patient Intake · Agnos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-paper text-ink">
        <PatientForm />
      </main>
    </>
  );
}
