import { Audiences } from './audiences';
import { GetStarted } from './get-started';
import { Header } from './header';
import { Hero } from './hero';
import { Journey } from './journey';
import { manrope } from './fonts';
import { MotionRoot } from './motion-root';
import { Problem } from './problem';
import { ProductPeek } from './product-peek';
import './landing.css';

// Runs before paint on a full page load; MotionRoot does the same after client navigation.
const MOTION_SCRIPT = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("has-motion")`;

export function LandingPage() {
    return (
        <div className={`landing ${manrope.variable}`}>
            <script dangerouslySetInnerHTML={{ __html: MOTION_SCRIPT }} />
            <MotionRoot />
            <Header />
            <main>
                <Hero />
                <Problem />
                <Journey />
                <Audiences />
                <ProductPeek />
                <GetStarted />
            </main>
        </div>
    );
}
