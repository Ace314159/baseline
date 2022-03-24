import { DateTime } from "luxon";
import { Ref, useEffect } from "react";
import { Log } from "../../db";
import { getDateFromLog } from "../../helpers";
import MoodLogCard from "./MoodLogCard";

interface Props {
    logs: Log[],
    container: Ref<HTMLDivElement>,
    setMenuDisabled: (disabled: boolean) => void
    reverse: boolean,
    requestedDate: {
        el: string,
        [key: string]: any
    }
}

const createLocator = (t: DateTime) => {
    return (<p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${t.month}${t.day}${t.year}`}>
            { t.toFormat("DDDD") }
        </p>)
}

const MoodLogList = ({ logs, container, setMenuDisabled, reverse, requestedDate } : Props) => {
    let els = [];
    let top: Log | undefined = undefined;
    const zone = DateTime.now().zone.name;

    let firstLogs = 0;
    const first = getDateFromLog(logs[0]);
    
    let t;
    let today = [];
    for (let log of logs) {
        if (log.day === first.day && log.month === first.month && log.year === first.year) ++firstLogs;
        if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
            if (!reverse) today.reverse();
            els.push(...today);
            if ((top && reverse) || !reverse) {
                t = getDateFromLog((reverse && top) ? top : log);
                els.push(createLocator(t));
            }
            today = [];
            top = log;
        }

        if (log.zone !== zone && t) {
            const addZone = t.setZone(log.zone).zone.offsetName(t.toMillis(), { format: "short" });
            if (!log.time.includes(addZone)) log.time += " " + addZone;
        }

        today.push(<MoodLogCard setMenuDisabled={setMenuDisabled} key={log.timestamp} log={log} />);
    }

    if (!reverse) today.reverse();
    els.push(...today);
    if (reverse && top) {
        t = getDateFromLog(top);
        els.push(createLocator(t));
    }

    if (reverse) {
        els.reverse();
    }

    els.push(
        <div className="bold text-center" key="end">
            <p>no more logs</p>
            <br />
        </div>
    );

    if (reverse) {
        els.push(<div className="reversed-list-spacer" style={{"height": `calc(100vh - ${(107 * firstLogs + 250)}px)`}} key="spacer"></div>);
    } else {
        els.unshift(<br key="begin" />)
    }

    useEffect(() => {
        if (reverse) {
            const list = document.getElementById("moodLogList")!;
            const ps = list.querySelectorAll("p");
            list.scrollTop = ps[ps.length - 2].offsetTop - list.offsetTop - 30;
        }
    }, [reverse]);

    // Scroll to position if we get a request
    useEffect(() => {
        const node = document.getElementById("moodLogList");
        if (!node) return;
        console.log("test");
        console.log(requestedDate);
        if (requestedDate && requestedDate.el && requestedDate.el[0] === "g") {
            const id = "i" + requestedDate.el.slice(1);
            const el = node.querySelector("#" + id) as HTMLElement;
            if (el) {
                node.scrollTo({
                    top: el.offsetTop - node.offsetTop - 30,
                    left: 0,
                    behavior: "smooth"
                })
            }
        }
    }, [requestedDate]);

    return (
        <div ref={container} id="moodLogList" className="mood-log-list">
            { els }
        </div>
    );
}

export default MoodLogList;