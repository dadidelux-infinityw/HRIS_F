import { Calendar, Clock, MapPin, Video } from "lucide-react";
import { Link } from "react-router-dom";
import type { UpcomingInterviewData } from "../../services/api";

interface UpcomingInterviewCardProps {
  interview: UpcomingInterviewData | null;
}

const UpcomingInterviewCard: React.FC<UpcomingInterviewCardProps> = ({
  interview,
}) => {
  if (!interview) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 rounded-xl border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <Calendar
          size={40}
          style={{ color: "var(--text-muted)" }}
          className="mb-3"
        />
        <h3
          className="text-base font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          No Upcoming Interviews
        </h3>
        <p
          className="text-sm text-center"
          style={{ color: "var(--text-muted)" }}
        >
          You have no scheduled interviews
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-xl border"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <h3
        className="font-semibold"
        style={{ color: "var(--text-primary)", fontSize: "19px" }}
      >
        Upcoming Interview
      </h3>

      <p
        className="font-medium"
        style={{ color: "var(--text-primary)", fontSize: "17px" }}
      >
        {interview.job_title}
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Calendar
            size={16}
            style={{ color: "var(--text-muted)" }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Date:
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {interview.interview_date}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock
            size={16}
            style={{ color: "var(--text-muted)" }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Time:
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {interview.interview_time}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin
            size={16}
            style={{ color: "var(--text-muted)" }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Location:
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {interview.location}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Video
            size={16}
            style={{ color: "var(--text-muted)" }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Type:
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {interview.interview_type}
          </span>
        </div>
      </div>

      <Link
        to="/my-interviews"
        className="self-start text-sm font-medium mt-1 hover:underline"
        style={{ color: "var(--text-muted)" }}
      >
        View Details
      </Link>
    </div>
  );
};

export default UpcomingInterviewCard;
