import { IonIcon, IonSpinner } from "@ionic/react";
import { ref, serverTimestamp, set } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { AnyMap, PullDataStates, BASELINE_GRAPH_CONFIG, calculateBaseline, parseSurveyHistory, toast } from "../../helpers";
import history from "../../history";
import Screener, { Priority } from "../../screeners/screener";
import SwiperType, { Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css";
import "swiper/css/pagination";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { useAuthState } from "react-firebase-hooks/auth";
import SurveyGraph from "./SurveyGraph";
import BaselineDescription from "./BaselineDescription";

interface Props {
    primary: Screener,
    secondary: Screener,
    update: boolean
}

const WeekInReviewReview = ({ primary, secondary, update }: Props) => {
    const [loading, setLoading] = useState(false);
    const [swiper, setSwiper] = useState<SwiperType | undefined>(undefined);
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | PullDataStates>(PullDataStates.NOT_STARTED);
    const [baselineGraph, setBaselineGraph] = useState<AnyMap[] | PullDataStates>(PullDataStates.NOT_STARTED);

    useEffect(() => {
        if (!user) return;
        // Try to set timestamp on load, to prevent duplicate surveys
        // in case the user doesn't hit the finish button
        if (update) set(ref(db, `/${user.uid}/lastWeekInReview`), serverTimestamp());
    }, [user, update]);

    const finish = async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (update) await set(ref(db, `/${user.uid}/lastWeekInReview`), serverTimestamp());
            history.push(update ? "/summary" : "/surveys");
        } catch (e: any) {
            toast(`Something went wrong, please try again. ${e.message}`);
            setLoading(false);
        }
    };

    const screeners = [primary, secondary]
        .filter(screener => screener.getPriority() !== Priority.DO_NOT_SHOW)
        .sort((a, b) => {
            return b.getPriority() - a.getPriority();
        });

    useEffect(() => {
        parseSurveyHistory(user, setSurveyHistory);
    }, [user]);

    useEffect(() => {
        calculateBaseline(setBaselineGraph);
    }, []);
    
    return <div className="center-summary container">
            <br />
            <Swiper 
                modules={[Pagination]}
                navigation={true}
                pagination={true}
                onSwiper={swiper => setSwiper(swiper)}
                className="swiper-container-mod"
            >
                <SwiperSlide style={{"display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                    <div>
                        <div className="title">Hi there.</div>
                        <p className="text-center">Let's go over your results.</p>
                    </div>
                </SwiperSlide>
                { screeners.map(screener => {
                    return <SwiperSlide key={screener._key}>
                        <div className="title">Results</div>
                        <div className="text-center screener-slide">
                            { screener.graphConfig && typeof surveyHistory === "object" && 
                                screener.processDataForGraph && 
                                <SurveyGraph data={screener.processDataForGraph(surveyHistory)} graphConfig={screener.graphConfig} /> }
                            { screener.getRecommendation() }
                            <p style={{"fontSize": "9px"}}>
                                If you want to discuss these results with a 
                                professional, show them this: { screener.getClinicalInformation() }
                            </p>
                            <br />
                        </div>
                    </SwiperSlide>
                }) }
                <SwiperSlide>
                    <div className="title">Your baseline</div>
                    <div className="text-center screener-slide">
                        { typeof baselineGraph === "object" && <>
                            <SurveyGraph data={baselineGraph} graphConfig={BASELINE_GRAPH_CONFIG} />
                            <BaselineDescription />
                        </> }
                        { typeof baselineGraph === "number" && <p>
                            Unfortunately, you haven't used baseline for at least three weeks yet &mdash; and that's how
                            much data we need to calculate your baseline! We'll try again next week.
                        </p> }
                        <div className="finish-button" onClick={finish}>
                            { !loading && <>Finish</> }
                            { loading && <IonSpinner className="loader" name="crescent" /> }
                        </div>
                        <br />
                    </div>
                </SwiperSlide>
            </Swiper>
            <div className="swiper-pagniation-controls">
                <IonIcon onClick={() => swiper?.slidePrev()} icon={chevronBackOutline} />
                <IonIcon onClick={() => swiper?.slideNext()} icon={chevronForwardOutline} />
            </div>
        </div>;
}

export default WeekInReviewReview;