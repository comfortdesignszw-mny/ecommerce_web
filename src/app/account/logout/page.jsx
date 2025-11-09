import useAuth from "@/utils/useAuth";

function MainComponent() {
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };
  return (
    <div className="min-h-screen bg-white font-inter flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-lg p-8 shadow-lg">
        <h1 className="text-2xl font-black text-neutral-800 text-center mb-8">
          COMFORT DESIGNS
        </h1>
        <h2 className="text-lg font-semibold text-neutral-700 text-center mb-6">
          Sign Out
        </h2>

        <button
          onClick={handleSignOut}
          className="w-full rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Sign Out
        </button>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .font-black {
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;
