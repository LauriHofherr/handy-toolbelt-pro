import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";

import Dashboard from "@/pages/Dashboard";
import ClientList from "@/pages/clients/ClientList";
import ClientForm from "@/pages/clients/ClientForm";
import ClientDetail from "@/pages/clients/ClientDetail";
import EstimateList from "@/pages/estimates/EstimateList";
import EstimateForm from "@/pages/estimates/EstimateForm";
import EstimateDetail from "@/pages/estimates/EstimateDetail";
import EstimateApproval from "@/pages/estimates/EstimateApproval";
import JobList from "@/pages/jobs/JobList";
import JobForm from "@/pages/jobs/JobForm";
import JobDetail from "@/pages/jobs/JobDetail";
import InvoiceList from "@/pages/invoices/InvoiceList";
import InvoiceForm from "@/pages/invoices/InvoiceForm";
import InvoiceDetail from "@/pages/invoices/InvoiceDetail";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/clients/:id/edit" element={<ClientForm />} />
            <Route path="/estimates" element={<EstimateList />} />
            <Route path="/estimates/new" element={<EstimateForm />} />
            <Route path="/estimates/:id" element={<EstimateDetail />} />
            <Route path="/estimates/:id/edit" element={<EstimateForm />} />
            <Route path="/estimates/:id/approve" element={<EstimateApproval />} />
            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/new" element={<JobForm />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/jobs/:id/edit" element={<JobForm />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
