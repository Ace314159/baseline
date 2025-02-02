import { DateTime } from "luxon";
import { COLORS, COLORS_CB, createPoints, getDateFromLog, getTime, parseSettings } from "../../../helpers";
import { chunk } from "lodash";
import useCallbackRef from "../../../useCallbackRef";
import { useCallback, useEffect, useState } from "react";

const LOCATOR_OFFSET = 30;

function createCalendarCard(date, colors, data=[]) {
    const points = createPoints(data, colors);
    const locator = "g-locator-" + date.toISODate();
    let dayHighlight = "";
    const today = DateTime.local();
    if (date.toISODate() === today.toISODate()) {
        dayHighlight += " highlight-day";
    }
    if (date.day === 1) {
        dayHighlight += " bold";
    }

    let monthHighlight = " " + (Math.abs(today.month - date.month) % 2 === 0 ? "one-month" : "two-month");

    let displayDate = "";
    if (date.day === 1) {
        if (date.year === today.year) {
            displayDate = date.toFormat("LLL d");
        } else {
            displayDate = date.toFormat("LLL d yy");
        }
    } else {
        displayDate = date.toFormat("d");
    }

    return (<div key={locator} id={locator} className={"calendar-card" + monthHighlight}>
                <div className={"calendar-card-date" + dayHighlight}>{ displayDate }</div>
                { points }
            </div>);
}

const MonthCalendar = ({ logs, requestedDate, setRequestedDate }) => {
    const settings = parseSettings();
    const [rows, setRows] = useState([]);
    const colors = settings["colorblind"] ? COLORS_CB : COLORS;

    const calendar = useCallbackRef(useCallback(node => {
        if (!node) return;
        // Listen for clicks on the calendar, and highlight
        // and request scroll to date if there's data there
        const clickListener = e => {
            let element = e.target;
            while (element && !element.id.includes("locator")) {
                if (element.id.includes("mainContent")) {
                    return;
                }
                element = element.parentElement;
            }

            // No logs? Don't highlight.
            if (!element || element.childElementCount < 2) return;

            setRequestedDate({
                ...requestedDate,
                el: "g" + element.id.slice(1),
                timeout: getTime() + 5
            });
        };

        // If a date is requested, scroll to it and highlight it
        if (requestedDate.el && requestedDate.el[0] === "i" && (!requestedDate.calendar || requestedDate.timeout < getTime())) {
            // Clear calendar if we've passed timeout
            if (requestedDate.calendar) {
                setRequestedDate({
                    ...requestedDate,
                    calendar: undefined
                });
            }

            const el = document.querySelector("#" + requestedDate.el.replace("i", "g"));
            if (el && (node.getBoundingClientRect().y > el.getBoundingClientRect().y || node.getBoundingClientRect().bottom < el.getBoundingClientRect().bottom)) {
                node.scrollTo({
                    top: el.offsetTop - node.offsetTop - LOCATOR_OFFSET,
                    left: 0,
                    behavior: settings.reduceMotion ? "auto" : "smooth"
                });
                setRequestedDate({
                    ...requestedDate,
                    calendar: el.offsetTop - node.offsetTop - LOCATOR_OFFSET,
                    timeout: getTime() + 1
                });
            }
        }

        // Computer-generated scroll event:
        // If the calendar makes it to the requested location,
        // clear it from the calendar state in requestedDate
        const scrollListener = () => {
            if (requestedDate.calendar) {
                if ((Math.abs(node.scrollTop - requestedDate.calendar) < 10) || requestedDate.timeout < getTime()) {
                    setRequestedDate({
                        ...requestedDate,
                        calendar: undefined
                    });
                }
            }
        }

        node.addEventListener("click", clickListener);
        node.addEventListener("scroll", scrollListener);
        return () => {
            if (node) {
                node.removeEventListener("click", clickListener);
                node.removeEventListener("scroll", scrollListener);
            }
        }
    }, [requestedDate, setRequestedDate, settings.reduceMotion]));

    useEffect(() => {
        let els = [];
        let i = 0;
        let current = getDateFromLog(logs[0]);
    
        // Create cards from today to first entry (with some padding at the start)
        // Now = latest saturday (monday = 1 for weekday)
        let now = DateTime.now().startOf("day");
        while (now.weekday !== 6) {
            now = now.plus({ days: 1 });
        }
    
        while (!now.equals(current) && now > current) {
            els.push(createCalendarCard(now, colors));
            now = now.minus({days: 1});
        }
    
        while (i < logs.length) {
            let todaysLogs = [];
            while (i < logs.length && getDateFromLog(logs[i]).equals(current)) {
                todaysLogs.push(logs[i]);
                i++;
            }
    
            // Create card for current day
            els.push(createCalendarCard(current, colors, todaysLogs));
            if (i === logs.length) break;
    
            // Create cards back to next populated day
            let next = getDateFromLog(logs[i]);
            while (!current.equals(next)) {
                current = current.minus({ days: 1 });
                if (!current.equals(next)) els.push(createCalendarCard(current, colors));
            }
        }
    
        // 7 days in a week, 6 rows by default = 42
        while (els.length < 42) {
            current = current.minus({ days: 1 });
            els.push(createCalendarCard(current, colors));
        }
    
        // Create empty cards for final week (stop on sunday = 7)
        while (current.weekday !== 7) {
            current = current.minus({ days: 1 });
            els.push(createCalendarCard(current, colors));
        }
    
        let rows = [];
        chunk(els, 7).forEach(row => {
            rows.push(<div key={row[0].key + "-row"} className="calendar-row">{row}</div>);
        });

        setRows(rows);
    }, [logs, colors]);

    useEffect(() => {
        const el = document.querySelector(".less-highlight-day");
        if (requestedDate.el && (!el || requestedDate.el !== el.parentElement.id)) {
            if (el) {
                el.classList.remove("less-highlight-day");
            }
            document.querySelector(`#${requestedDate.el.replace("i", "g")}`).children[0].classList.add("less-highlight-day");
        }
    }, [requestedDate, rows]);

    return <>
        <div className="calendar-date-strip">
            <span>Sunday</span>
            <span>Monday</span>
            <span>Tuesday</span>
            <span>Wednesday</span>
            <span>Thursday</span>
            <span>Friday</span>
            <span>Saturday</span>
        </div>
        <div ref={calendar} className="month-calendar">{ rows }</div>
    </>
}

export default MonthCalendar;