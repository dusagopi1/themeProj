import WeatherCard from './components/WeatherCard'

function App() {
  return (
    <main className="relative min-h-screen overflow-hidden p-4 sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute -left-24 top-[-6rem] h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-7rem] h-[24rem] w-[24rem] rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <WeatherCard />
      </div>
    </main>
  )
}

export default App
