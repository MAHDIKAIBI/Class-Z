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

import { MagnatesStage_TwoPart, RedactedMemoEvidence, FinancialAuditGraphEvidence, BiometricWireframeEvidence } from './components/MagnatesStage_TwoPart';
import { ZAxisCrashTransition } from './components/transition1';
import { SpatialWhipTransition } from './components/transition2';
import { ThermalFlareTransition } from './components/transition3';
import { RackToBlackTransition } from './components/transition4';
import { LumaDissolveTransition } from './components/transition5';
import { ParallaxSlideTransition } from './components/transition6';
import { ZoomSpinVortexTransition } from './components/transition7';
import { PrismDispersionTransition } from './components/transition8';
import { GlitchDataTearTransition } from './components/transition9';
import { CinematicMatchCutTransition } from './components/transition10';
import { CameraWallTransition } from './components/transition11';
import { Sequence } from 'remotion';

export const SampleSceneAlpha = () => (
    <AbsoluteFill style={{
        background: 'linear-gradient(135deg, #1f1807 0%, #0d0a03 50%, #050401 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"Playfair Display", serif',
        border: '10px solid #D4AF37',
        boxSizing: 'border-box',
        overflow: 'hidden',
    }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(212,175,55,0.25) 0%, transparent 70%)' }} />
        <span style={{ fontFamily: 'monospace', fontSize: 26, color: '#F5D77F', letterSpacing: 8, marginBottom: 16 }}>CONFIDENTIAL // CASE FILE 01</span>
        <h1 style={{ fontSize: 110, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: 8, textShadow: '0 20px 40px rgba(0,0,0,0.95)' }}>THE CARTEL ARCHIVE</h1>
        <span style={{ fontFamily: 'monospace', fontSize: 22, color: '#D4AF37', marginTop: 20, letterSpacing: 5 }}>VALUATION: $4.8 BILLION USD</span>
    </AbsoluteFill>
);

export const SampleSceneBeta = () => (
    <AbsoluteFill style={{
        background: 'linear-gradient(135deg, #042526 0%, #021213 50%, #010607 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"Playfair Display", serif',
        border: '10px solid #00F0FF',
        boxSizing: 'border-box',
        overflow: 'hidden',
    }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(0,240,255,0.22) 0%, transparent 70%)' }} />
        <span style={{ fontFamily: 'monospace', fontSize: 26, color: '#38BDF8', letterSpacing: 8, marginBottom: 16 }}>TARGET ACQUISITION // SATELLITE</span>
        <h1 style={{ fontSize: 110, color: '#FFFFFF', margin: 0, textTransform: 'uppercase', letterSpacing: 8, textShadow: '0 20px 40px rgba(0,0,0,0.95)' }}>CAPITAL FLIGHT DEPT</h1>
        <span style={{ fontFamily: 'monospace', fontSize: 22, color: '#00F0FF', marginTop: 20, letterSpacing: 5 }}>STATUS: ASSET INTERCEPT ACTIVE</span>
    </AbsoluteFill>
);

export const Transition1Showcase = () => (
    <ZAxisCrashTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition2Showcase = () => (
    <SpatialWhipTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition3Showcase = () => (
    <ThermalFlareTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition4Showcase = () => (
    <RackToBlackTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition5Showcase = () => (
    <LumaDissolveTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition6Showcase = () => (
    <ParallaxSlideTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition7Showcase = () => (
    <ZoomSpinVortexTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition8Showcase = () => (
    <PrismDispersionTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const Transition9Showcase = () => (
    <GlitchDataTearTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={25} />
);

export const Transition10Showcase = () => (
    <CinematicMatchCutTransition SceneA={<SampleSceneAlpha />} SceneB={<SampleSceneBeta />} durationInFrames={30} />
);

export const StudioSceneAlpha = () => (
    <AbsoluteFill style={{
        background: 'radial-gradient(circle at 60% 40%, #78350f, #1c1917)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
                background: '#f59e0b',
                color: '#000',
                fontWeight: 900,
                fontSize: '22px',
                padding: '10px 22px',
                borderRadius: '10px',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} />
                SCENE A // HOST AT MIC
            </div>
            <div style={{
                background: 'rgba(0,0,0,0.70)',
                padding: '10px 20px',
                borderRadius: '8px',
                color: '#f59e0b',
                fontSize: '20px',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '1px',
            }}>
                MIC 01 LIVE
            </div>
        </div>

        <div>
            <h1 style={{ fontSize: '72px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-1px' }}>
                "The Investigation Begins"
            </h1>
            <p style={{ fontSize: '24px', color: '#fde68a', fontFamily: 'monospace', marginTop: '12px' }}>
                Origin Scene &bull; 1080p Studio Rig &bull; Outgoing Narrative
            </p>
        </div>

        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: '18px',
        }}>
            <span>FPS: 30 &bull; DOCK ORIGIN</span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>PHASE 1 ORIGIN</span>
        </div>
    </AbsoluteFill>
);

export const StudioSceneBeta = () => (
    <AbsoluteFill style={{
        background: 'radial-gradient(circle at 60% 40%, #064e3b, #022c22)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
                background: '#10b981',
                color: '#000',
                fontWeight: 900,
                fontSize: '22px',
                padding: '10px 22px',
                borderRadius: '10px',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#000000' }} />
                SCENE B // GUEST PERSPECTIVE
            </div>
            <div style={{
                background: 'rgba(0,0,0,0.70)',
                padding: '10px 20px',
                borderRadius: '8px',
                color: '#10b981',
                fontSize: '20px',
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '1px',
            }}>
                MIC 02 READY
            </div>
        </div>

        <div>
            <h1 style={{ fontSize: '72px', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-1px' }}>
                "The Counter-Testimony"
            </h1>
            <p style={{ fontSize: '24px', color: '#a7f3d0', fontFamily: 'monospace', marginTop: '12px' }}>
                Incoming Scene &bull; Target Seamless Docking
            </p>
        </div>

        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#94a3b8',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: '18px',
        }}>
            <span>FPS: 30 &bull; DOCK TARGET</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>PHASE 4 DESTINATION</span>
        </div>
    </AbsoluteFill>
);

export const Transition11Showcase = () => (
    <CameraWallTransition SceneA={<StudioSceneAlpha />} SceneB={<StudioSceneBeta />} durationInFrames={60} />
);

export const AllTransitionsReelShowcase = () => (
    <AbsoluteFill>
        <Sequence from={0} durationInFrames={30}>
            <Transition5Showcase />
        </Sequence>
        <Sequence from={30} durationInFrames={30}>
            <Transition6Showcase />
        </Sequence>
        <Sequence from={60} durationInFrames={30}>
            <Transition7Showcase />
        </Sequence>
        <Sequence from={90} durationInFrames={30}>
            <Transition8Showcase />
        </Sequence>
        <Sequence from={120} durationInFrames={30}>
            <Transition9Showcase />
        </Sequence>
        <Sequence from={150} durationInFrames={30}>
            <Transition10Showcase />
        </Sequence>
    </AbsoluteFill>
);

export const ProceduralEvidenceShowcase = () => (
    <AbsoluteFill style={{ backgroundColor: '#020306', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, padding: 60 }}>
        <RedactedMemoEvidence accentColor="#D4AF37" width={680} height={520} />
        <FinancialAuditGraphEvidence accentColor="#D4AF37" width={680} height={520} />
        <BiometricWireframeEvidence accentColor="#D4AF37" width={680} height={520} />
    </AbsoluteFill>
);

export const MagnatesStage_TwoPartShowcase = () => {
    // REAL PRODUCTION SCENARIO: Gemini output with 1 single image for orbit_helpers
    const testPayload = {
        scene_type: 'two_part_whip',
        part_1: {
            hero: {
                trigger_start_ms: 300,
                local_path: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800',
            },
            orbit_helpers: {
                trigger_start_ms: 600,
                local_path: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
                count: 4,
            },
        },
        transition: {
            trigger_start_ms: 3000,
            direction: 'right',
        },
        part_2: {
            background: {
                grid_color: 'gold',
            },
            subject: {
                trigger_start_ms: 3200,
                position: 'left',
                local_path: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
            },
            typography: {
                trigger_start_ms: 3500,
                text: 'THE OBSIDIAN EMPIRE',
            },
        },
    };

    return <MagnatesStage_TwoPart payload={testPayload} durationInFrames={210} />;
};

import { Floating3DCardsCanvas } from './components/Floating3DCards';

export const Floating3DCardsShowcase = () => (
    <AbsoluteFill style={{ backgroundColor: '#020306' }}>
        <Floating3DCardsCanvas payload={{
            duration: 240,
            actualDurationFrames: 240,
            headlineTag: "TOPIC REVEAL // THE 2026 PAYLOAD",
            headlineText: "We Are Breaking Down The Only 5 Brands That Genuinely Deserve Your Money",
            themeNiche: "midi",
            subjects: [
                { id: "s1", rank: "#5", label: "ENTRY BENCHMARK", subtitle: "UNCOMPROMISED VELOCITY", color: "#00F0FF" },
                { id: "s2", rank: "#4", label: "STANDALONE HYBRID", subtitle: "ZERO SOFTWARE LOCK-IN", color: "#00E5FF" },
                { id: "s3", rank: "#3", label: "PRO STUDIO WORKHORSE", subtitle: "FATAR KEYBED PHYSICS", color: "#38BDF8" },
                { id: "s4", rank: "#2", label: "ANALOG EXPRESSION", subtitle: "POLYPHONIC BIDIRECTIONAL", color: "#60A5FA" },
                { id: "s5", rank: "#1", label: "THE UNDISPUTED TITAN", subtitle: "CLASSIFIED // TOP REVEAL", color: "#F59E0B", isClassified: true }
            ]
        }} />
    </AbsoluteFill>
);

export const ShowcaseRegistry = () => (
    <>
        <Composition id="Preview-Floating3DCards" component={Floating3DCardsShowcase} durationInFrames={240} fps={30} width={2560} height={1333} />
        <Composition id="Preview-ProceduralEvidence" component={ProceduralEvidenceShowcase} durationInFrames={120} fps={30} width={2560} height={1333} />
        <Composition id="Preview-MagnatesStage-TwoPart" component={MagnatesStage_TwoPartShowcase} durationInFrames={210} fps={30} width={2560} height={1333} />
        <Composition id="Preview-AnimatedNumber" component={AnimatedNumberShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview-AnimatedWord" component={AnimatedWordShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Effects" component={EffectsShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview-GlassStatGrid" component={GlassStatGridShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview-KineticStack" component={KineticStackShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        <Composition id="Preview-OrganicCamera-GlobalFinisher" component={CameraAndFinisherShowcase} durationInFrames={150} fps={30} width={2560} height={1333} />
        
        {/* 11 TRANSITIONS SHOWCASE */}
        <Composition id="Preview-Transition1-ZAxisCrash" component={Transition1Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition2-SpatialWhip" component={Transition2Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition3-ThermalFlare" component={Transition3Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition4-RackToBlack" component={Transition4Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition5-LumaDissolve" component={Transition5Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition6-ParallaxSlide" component={Transition6Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition7-ZoomSpinVortex" component={Transition7Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition8-PrismDispersion" component={Transition8Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition9-GlitchDataTear" component={Transition9Showcase} durationInFrames={25} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition10-CinematicMatchCut" component={Transition10Showcase} durationInFrames={30} fps={30} width={2560} height={1333} />
        <Composition id="Preview-Transition11-CameraWall" component={Transition11Showcase} durationInFrames={60} fps={30} width={2560} height={1333} />
        <Composition id="Preview-AllTransitionsReel" component={AllTransitionsReelShowcase} durationInFrames={180} fps={30} width={2560} height={1333} />
    </>
);
