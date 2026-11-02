import type { CSSProperties } from 'react';

type WaveTitleProps = {
    /** id for the <h2>; the section points aria-labelledby at it. */
    id: string;
    text: string;
    className?: string;
};

/**
 * A section heading whose letters rise into place as it scrolls in (ported from
 * Techfini). MotionRoot's "enter" progress drives each letter by its position in the
 * line, transforms only. Screen readers get the plain text. Static without motion.
 */
export function WaveTitle({ id, text, className }: WaveTitleProps) {
    const total = text.length;
    let position = 0;

    return (
        <h2 id={id} data-progress="enter" className={`wave ${className ?? ''}`}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {text.split(' ').map((word, w) => {
                    const letters = Array.from(word).map((letter) => {
                        const at = position++ / total;
                        return (
                            <span key={position} className="wave__char" style={{ '--at': at.toFixed(3) } as CSSProperties}>
                                {letter}
                            </span>
                        );
                    });
                    position++; // the space
                    return (
                        <span key={w}>
                            {w > 0 && ' '}
                            <span className="wave__word">{letters}</span>
                        </span>
                    );
                })}
            </span>
        </h2>
    );
}
