import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function FormsExample() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><div className="text-lg font-semibold">Create Project</div></CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" placeholder="e.g., LLM Dashboard" />
            </div>
            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" placeholder="Jane Doe" />
            </div>
            <div>
              <Label>Status</Label>
              <Select defaultValue="active">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input id="budget" type="number" placeholder="50000" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" placeholder="Project description..." />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button variant="outline" type="reset">Cancel</Button>
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
