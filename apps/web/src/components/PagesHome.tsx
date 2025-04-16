import { Button } from "@neostack/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@neostack/ui/components/card";
import { ArrowRight } from "lucide-react";
export function PagesHome() {
  return (
    <div className="bg-background min-h-screen text-foreground">
      {/* Hero Section */}
      <section className="relative flex justify-center items-center bg-gradient-to-br from-primary/10 via-background to-primary/10 h-first-page overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="z-10 relative mx-auto px-4 max-w-4xl text-center">
          <h1 className="bg-clip-text bg-gradient-to-r from-foreground to-primary font-extrabold text-transparent text-5xl sm:text-7xl tracking-tight">
            Build the Future
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground text-lg sm:text-xl leading-relaxed">
            Unleash your creativity with our cutting-edge platform. Fast,
            intuitive, and built for innovators.
          </p>
          <div className="flex justify-center gap-4 mt-10">
            <Button
              size="lg"
              className="group bg-primary hover:bg-primary/90 rounded-full hover:scale-105 transition-all duration-300 transform"
              asChild
            >
              <a href="/register">
                Start Now
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="hover:bg-muted/50 border-muted-foreground/20 rounded-full transition-all duration-300"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 dark:bg-muted/10 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="bg-clip-text bg-gradient-to-r from-foreground to-primary/60 mb-16 font-bold text-transparent text-4xl text-center">
            Why We're Different
          </h2>
          <div className="gap-8 grid sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="bg-card/80 dark:bg-card/50 shadow-lg hover:shadow-xl backdrop-blur-sm border-none transition-all hover:-translate-y-1 duration-300 transform">
              <CardHeader>
                <CardTitle className="font-semibold text-xl">
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
            <Card className="bg-card/80 dark:bg-card/50 shadow-lg hover:shadow-xl backdrop-blur-sm border-none transition-all hover:-translate-y-1 duration-300 transform">
              <CardHeader>
                <CardTitle className="font-semibold text-xl">
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
            <Card className="bg-card/80 dark:bg-card/50 shadow-lg hover:shadow-xl backdrop-blur-sm border-none transition-all hover:-translate-y-1 duration-300 transform">
              <CardHeader>
                <CardTitle className="font-semibold text-xl">
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
      <section className="bg-gradient-to-b from-background to-muted/20 px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 font-bold text-4xl">
            Ready to Elevate Your Game?
          </h2>
          <p className="mb-10 text-muted-foreground text-lg">
            Join thousands of creators and start building something
            extraordinary today.
          </p>
          <Button
            size="lg"
            className="relative bg-gradient-to-r from-primary hover:from-primary/90 to-primary/80 hover:to-primary px-8 py-6 rounded-full font-semibold text-primary-foreground text-lg hover:scale-105 transition-all duration-300 transform"
          >
            Join the Revolution
            <span className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 rounded-full transition-opacity" />
          </Button>
        </div>
      </section>
    </div>
  );
}
