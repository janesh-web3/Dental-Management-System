import PageHead from "@/components/shared/page-head";
import { DoctorTable } from "./Table";

const Doctor = () => {
  return (
      <div>
        <PageHead title="Doctor Management" />

        <div className="flex justify-center w-auto h-auto mx-auto overflow-auto">
          <DoctorTable />
        </div>
      </div>
  );
};

export default Doctor;
