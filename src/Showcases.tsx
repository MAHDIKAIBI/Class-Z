import React from 'react';
import { Composition, AbsoluteFill } from 'remotion';

import { AnimatedNumber } from './components/AnimatedNumber';
import { AnimatedWord } from './components/AnimatedWord';
import { EffectsDirector } from './components/Effects';
import { GlassStatGrid } from './components/GlassStatGrid';
import { GlobalFinisher } from './components/GlobalFinisher';
import { KineticStack } from './components/KineticStack';
import { OrganicCamera } from './components/OrganicCamera';

export const AnimatedNumberShowcase = () => (
    <AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedNumber numericValue={75} durationFrames={150} type="money" prefix="$" suffix="k" />
    </AbsoluteFill>
);

export const AnimatedWordShowcase = () => (
    <AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedWord word="CRITICAL" globalIndex={0} durationFrames={150} category="Danger" />
    </AbsoluteFill>
);

export const EffectsShowcase = () => (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
        <EffectsDirector variants={['money']} events={[{ type: 'money', start: 0, end: 150 }]} />
        <div style={{ position: 'absolute', color: 'white', fontSize: 60, top: '50%', width: '100%', textAlign: 'center' }}>Effects Showcase</div>
    </AbsoluteFill>
);

export const GlassStatGridShowcase = () => (
    <AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200)', backgroundSize: 'cover' }}>
        <GlassStatGrid 
            start={10} 
            end={140} 
            stats={[
                { label: 'Velocity', value: 842, suffix: 'mph' },
                { label: 'Altitude', value: 12, suffix: 'k' },
                { label: 'G-Force', value: 3.2, suffix: 'g' }
            ]} 
        />
    </AbsoluteFill>
);

export const KineticStackShowcase = () => (
    <AbsoluteFill style={{ backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <KineticStack words={['MASSIVE', 'ENGINEERING', 'FAILURES']} side="left" layoutType="C" durationFrames={150} />
    </AbsoluteFill>
);

export const CameraAndFinisherShowcase = () => (
    <GlobalFinisher>
        <OrganicCamera seed="test-seed">
            <AbsoluteFill style={{ backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
                <h1 style={{ color: 'white', fontSize: 120 }}>Handheld Drift + Finisher</h1>
            </AbsoluteFill>
        </OrganicCamera>
    </GlobalFinisher>
);

export const ShowcaseRegistry = () => (
    <>
        <Composition id="Preview_AnimatedNumber" component={AnimatedNumberShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview_AnimatedWord" component={AnimatedWordShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview_Effects" component={EffectsShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview_GlassStatGrid" component={GlassStatGridShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview_KineticStack" component={KineticStackShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview_OrganicCamera_GlobalFinisher" component={CameraAndFinisherShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
    </>
);
