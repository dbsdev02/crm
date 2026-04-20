import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
    <Card>
      <CardContent className="pt-6 flex flex-col items-center justify-center py-20 text-center">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Coming Soon</p>
        <p className="text-sm text-muted-foreground mt-1">This module is under development. Connect your backend to enable it.</p>
      </CardContent>
    </Card>
  </div>
);

export default PlaceholderPage;
