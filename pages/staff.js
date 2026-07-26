import Head from "next/head";
import StaffDashboard from "../components/StaffDashboard";

export default function StaffPage() {
  return (
    <>
      <Head>
        <title>Staff Monitor · Agnos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-slate-950 text-paper">
        <StaffDashboard />
      </main>
    </>
  );
}
