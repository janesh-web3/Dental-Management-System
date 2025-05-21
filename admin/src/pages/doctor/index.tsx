import PageHead from "@/components/shared/page-head";
import { DoctorTable } from "./Table";
import DoctorLayout from "@/components/layout/doctor-layout";

const Doctor = () => {
  return (
    <DoctorLayout>
      <div>
        <PageHead title="Doctor Management" />

        <div className="flex justify-center w-auto h-auto mx-auto overflow-auto">
          <DoctorTable />
        </div>
      </div>
    </DoctorLayout>
  );
};

export default Doctor;
