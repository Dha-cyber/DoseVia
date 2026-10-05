import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useCallback } from "react";
import IntroSplash from "@/components/graphics/IntroSplash";
import PageTransition from "@/components/graphics/PageTransition";

// Pages
import Login from "@/pages/Login";
import DoctorDashboard from "@/pages/doctor/Dashboard";
import DoctorAnalysis from "@/pages/doctor/Analysis";
import DoctorVisualisations from "@/pages/doctor/Visualisations";
import DoctorDatabase from "@/pages/doctor/Database";
import DoctorReport from "@/pages/doctor/Report";
import DoctorMessages from "@/pages/doctor/Messages";
import DoctorAppointments from "@/pages/doctor/Appointments";
import DoctorNotifications from "@/pages/doctor/Notifications";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminAppointments from "@/pages/admin/Appointments";
import AdminDoctors from "@/pages/admin/Doctors";
import AdminPatients from "@/pages/admin/Patients";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminActivity from "@/pages/admin/Activity";
import PatientDoctors from "@/pages/patient/Doctors";
import PatientChat from "@/pages/patient/Chat";
import PatientAppointments from "@/pages/patient/Appointments";
import PatientHome from "@/pages/patient/Home";
import PatientMeds from "@/pages/patient/Meds";
import PatientLifestyle from "@/pages/patient/Lifestyle";
import PatientAsk from "@/pages/patient/Ask";
import PatientEmergency from "@/pages/patient/Emergency";
import NotFound from "@/pages/not-found";

function ProtectedRoute({
  component: Component,
  role,
}: {
  component: React.ComponentType;
  role: "doctor" | "patient" | "admin";
}) {
  const { user } = useApp();
  const [, setLocation] = useLocation();
  if (!user) {
    setLocation("/");
    return null;
  }
  if (user.role !== role) {
    setLocation(
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "doctor"
          ? "/doctor/dashboard"
          : "/patient/home",
    );
    return null;
  }
  return <Component />;
}

function AnimatedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3,
      }}
      className="min-h-screen"
    >
      <Component />
    </motion.div>
  );
}

function AppRoutes() {
  const [location] = useLocation();
  const isPatient = location.startsWith("/patient");
  return (
    <>
      {location !== "/" && (
        <PageTransition
          key={location}
          path={location}
          accent={
            isPatient
              ? "#7C3AED"
              : location.startsWith("/admin")
                ? "#0F766E"
                : "#185FA5"
          }
        />
      )}
      <AnimatePresence mode="wait">
        <Switch key={location}>
          <Route path="/" component={Login} />
          <Route path="/doctor/dashboard">
            {() => <ProtectedRoute component={DoctorDashboard} role="doctor" />}
          </Route>
          <Route path="/doctor/analysis">
            {() => <ProtectedRoute component={DoctorAnalysis} role="doctor" />}
          </Route>
          <Route path="/doctor/visualisations">
            {() => (
              <ProtectedRoute component={DoctorVisualisations} role="doctor" />
            )}
          </Route>
          <Route path="/doctor/database">
            {() => <ProtectedRoute component={DoctorDatabase} role="doctor" />}
          </Route>
          <Route path="/doctor/messages">
            {() => <ProtectedRoute component={DoctorMessages} role="doctor" />}
          </Route>
          <Route path="/doctor/appointments">
            {() => (
              <ProtectedRoute component={DoctorAppointments} role="doctor" />
            )}
          </Route>
          <Route path="/doctor/notifications">
            {() => (
              <ProtectedRoute component={DoctorNotifications} role="doctor" />
            )}
          </Route>
          <Route path="/admin/dashboard">
            {() => <ProtectedRoute component={AdminDashboard} role="admin" />}
          </Route>
          <Route path="/admin/appointments">
            {() => (
              <ProtectedRoute component={AdminAppointments} role="admin" />
            )}
          </Route>
          <Route path="/admin/doctors">
            {() => <ProtectedRoute component={AdminDoctors} role="admin" />}
          </Route>
          <Route path="/admin/patients">
            {() => <ProtectedRoute component={AdminPatients} role="admin" />}
          </Route>
          <Route path="/admin/notifications">
            {() => (
              <ProtectedRoute component={AdminNotifications} role="admin" />
            )}
          </Route>
          <Route path="/admin/activity">
            {() => <ProtectedRoute component={AdminActivity} role="admin" />}
          </Route>
          <Route path="/doctor/report">
            {() => <ProtectedRoute component={DoctorReport} role="doctor" />}
          </Route>
          <Route path="/patient/home">
            {() => <ProtectedRoute component={PatientHome} role="patient" />}
          </Route>
          <Route path="/patient/meds">
            {() => <ProtectedRoute component={PatientMeds} role="patient" />}
          </Route>
          <Route path="/patient/lifestyle">
            {() => (
              <ProtectedRoute component={PatientLifestyle} role="patient" />
            )}
          </Route>
          <Route path="/patient/ask">
            {() => <ProtectedRoute component={PatientAsk} role="patient" />}
          </Route>
          <Route path="/patient/doctors">
            {() => <ProtectedRoute component={PatientDoctors} role="patient" />}
          </Route>
          <Route path="/patient/chat">
            {() => <ProtectedRoute component={PatientChat} role="patient" />}
          </Route>
          <Route path="/patient/appointments">
            {() => (
              <ProtectedRoute component={PatientAppointments} role="patient" />
            )}
          </Route>
          <Route path="/patient/emergency">
            {() => (
              <ProtectedRoute component={PatientEmergency} role="patient" />
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AnimatePresence>
    </>
  );
}

function Root() {
  const { user } = useApp();
  const [introDone, setIntroDone] = useState(
    () => !!user || sessionStorage.getItem("DoseVia_intro_seen") === "1",
  );
  const finish = useCallback(() => {
    sessionStorage.setItem("DoseVia_intro_seen", "1");
    setIntroDone(true);
  }, []);
  return (
    <>
      <WouterRouter
        base={
          import.meta.env.BASE_URL === "./"
            ? ""
            : (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "")
        }
      >
        <AppRoutes />
      </WouterRouter>
      {!introDone && <IntroSplash onDone={finish} />}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <Root />
        <Toaster />
      </TooltipProvider>
    </AppProvider>
  );
}

export default App;
