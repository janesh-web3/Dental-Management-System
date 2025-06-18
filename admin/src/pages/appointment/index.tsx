
import PageHead from "@/components/shared/page-head";
import AppointmentTable from "./AppointmentTable";
const Appointment = () => {
  

  return <div>
    <PageHead title="Appontment"/>
    <div className="mt-5 md:space-x-5">
      <AppointmentTable/>
    </div>
  </div>;
};

export default Appointment;
