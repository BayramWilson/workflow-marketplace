import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button>Click me</Button>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </div>
  )
}

export default App
