import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@neostack/ui/components/card";

export function PagesDashboard() {
  return (
    <div className="mx-auto container">
      <h1 className="mb-6 font-bold text-3xl tracking-tight">
        Transcription Dashboard
      </h1>
      <div className="gap-6 grid lg:grid-cols-3">
        {/* Form Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Queue New Transcription</CardTitle>
            <CardDescription>
              Submit an audio URL to start processing.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
