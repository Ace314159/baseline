import { DateTime } from "luxon";
import MoodLogCard from "./MoodLogCard";

const MoodLogList = ({ logs, container, setMenuDisabled }) => {
    let els = [<br key="begin"/>];
    let top = false;
    const now = DateTime.now();
    const zone = now.zone.offsetName(now.toMillis(), { format: "short" });
    let today = [];
    for (let log of logs) {
        if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
            els.push(today.reverse());
            today = [];
            top = log;
            const t = DateTime.fromObject({ year: log.year, month: log.month, day: log.day });
            els.push(
                <p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${top.month}${top.day}${top.year}`}>
                    { t.toFormat("DDDD") }
                </p>
            );
        }

        if (log.zone !== zone && !log.time.includes(log.zone)) {
            log.time += " " + log.zone;
        }

        today.push(<MoodLogCard setMenuDisabled={setMenuDisabled} key={log.timestamp} log={log} />);
    }

    els.push(today.reverse());
    els.push(
        <div className="bold text-center" key="end">
            <p>no more logs</p>
            <br />
        </div>
    );

    return (
        <>
            <div ref={container} id="moodLogList" className="mood-log-list">
                { els }
            </div>
        </>
    );
}

export default MoodLogList;