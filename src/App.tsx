import { Redirect, Route } from "react-router-dom";
import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import MoodLog from "./pages/MoodLog";
import Journal from "./pages/Journal";
import Login from "./pages/Login";
import { Switch } from "react-router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const App: React.FC = () => {
    const [user, loading, error] = useAuthState(auth);

    return (
        <IonApp>
            { loading && <p>Loading... { error } </p> }
            { !loading && !user && <Login></Login> }
            { !loading && user && <IonReactRouter>
                <Switch>
                    <Route path="/journal" component={Journal} />
                    <Route path="/log" component={MoodLog} />
                    <Redirect from="/" to="/journal" />
                </Switch>
            </IonReactRouter> }
        </IonApp>
    );
};

export default App;
