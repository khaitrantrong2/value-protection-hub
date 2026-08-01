# Value Protection Hub — Crew Character Asset Contract (v8)

Status: **awaiting approved GLB assets.** All procedural/placeholder characters
have been removed. Production UI (Home, Crew) will NOT show any character until
the files below are supplied and approved in **CharacterLab** (`character-lab.html`).

## Required files

Drop the approved binary glTF files at these exact paths:

```
public/models/crew/khai.glb
public/models/crew/lan.glb
```

(For the standalone HTML build, place them at `public/models/crew/…` relative to
`character-lab.html`. CharacterLab fetches these paths directly.)

## GLB specification

| Requirement            | Value / rule                                                        |
|------------------------|---------------------------------------------------------------------|
| Container              | `.glb` (binary glTF 2.0)                                             |
| Orientation            | **Y-up**                                                            |
| Origin / pivot         | at the **feet**, model centered on X/Z                              |
| Scale                  | consistent **real-world meters** (same scale for every crew member) |
| Rig                    | rigged **humanoid skeleton**; prefer **one shared skeleton** for all |
| Materials              | **PBR** (metallic-roughness)                                        |
| Material separation    | distinct materials for **visor, suit, hair, skin, emissive, accessory** where possible |
| Triangles              | **~15k–30k** per character                                          |
| Textures               | **≤ 2048px** unless justified; power-of-two preferred               |
| Optimization           | web-optimized (Draco/meshopt OK if decoders provided); trim unused nodes |

## Required animation clips (exact names)

Name the `AnimationClip`s exactly so the app can bind them:

- `Idle`
- `Wave`
- `Salute`
- `Point`

`Idle` should loop; `Wave`/`Salute`/`Point` play once then return to `Idle`.

## Per-character identity (art direction reference)

**Khải — Commander:** electric cyan `#35D6FF`, deep navy `#0B2A5B`, command gold
`#FFC857`. Strongest/broadest silhouette, command insignia, wrist console, subtle
holographic navigation device.

**Lan — R2R Lead:** royal violet `#B388FF`, indigo navy `#1B1F5E`, aqua mint
`#5EEAD4`. Elegant structured silhouette, R2R/control insignia, finance/data
tablet. Visually leadership-tier but slightly less dominant than Khải — a
genuinely distinct character, not a recolor.

## Future crew (after Khải & Lan approved)

Huệ, Hùng (VN) · Ice, Kla (TH) · Nguyên (SG) · Ngân (MY) · Thành (PH & ID, dual
badge) · Phương (Cadet). Same shared skeleton + clip set; vary material, hair,
helmet, accessory, and body scale. Clone with `SkeletonUtils.clone`, share
geometry/textures.

## Integration plan (only after approval in CharacterLab)

- lazy-load GLBs; `AnimationMixer` per instance
- dispose mixers, geometries, materials, textures on unmount
- cap `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`
- `prefers-reduced-motion`: freeze on a static `Idle` pose
- one shared render loop; never duplicate rAF loops
- keep DOM buttons + labels for keyboard accessibility
