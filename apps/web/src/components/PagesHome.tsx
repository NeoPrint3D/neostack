import { Button } from "@neo-stack/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@neo-stack/ui/components/card";
import { ArrowRight } from "lucide-react";
export function PagesHome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative flex h-first-page items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary">
            Build the Future
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Unleash your creativity with our cutting-edge platform. Fast,
            intuitive, and built for innovators.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button
              size="lg"
              className="group bg-primary hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 rounded-full"
              asChild
            >
              <a href="/register">
                Start Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-muted-foreground/20 hover:bg-muted/50 transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-muted/30 dark:bg-muted/10 ">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-primary/60">
            Why We're Different
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-none bg-card/80 dark:bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Lightning Fast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Optimized for speed, our platform delivers instant results
                  without compromise.
                </p>
              </CardContent>
            </Card>
            {/* Feature 2 */}
            <Card className="border-none bg-card/80 dark:bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Seamless Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Intuitive interfaces that make complex tasks feel effortless
                  and natural.
                </p>
              </CardContent>
            </Card>
            {/* Feature 3 */}
            <Card className="border-none bg-card/80 dark:bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Always On Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our team is here 24/7 to ensure you succeed at every step.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 text-center bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Elevate Your Game?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of creators and start building something
            extraordinary today.
          </p>
          <Button
            size="lg"
            className="relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Join the Revolution
            <span className="absolute inset-0 rounded-full bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </section>
    </div>
  );
}
