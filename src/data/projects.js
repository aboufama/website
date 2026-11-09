import { img, video, url, sizes } from './media'

const hex = 'projects/hexapod/'
const ver = 'projects/veridien/'
const helios = 'projects/helios-x/'
const mask = 'projects/face-mask/'
const plant = 'projects/plant-bot/'
const glove = 'projects/gauntlet/'
const hydro = 'projects/modular-hydroponics/'
const rover = 'projects/autonomous-rover/'

const still = (path, extra) => ({ type: 'image', ...img(path), ...extra })
const cutout = (path, extra) => still(path, { transparent: true, ...extra })
const toggle = (a, b) => ({ type: 'toggle', srcs: [url(a), url(b)] })

// In a description, [[double brackets]] mark the sentences about my own part of the project
// (the "what I did" switch keeps those and fades the rest), and [text](https://...) is a link.
const projects = [
  {
    id: 'hexapod',
    title: 'Hexapod',
    org: { name: 'Cornell Physical Intelligence', href: 'https://cornellphysicalintelligence.com/', logo: url('logos/cupi.svg'), width: 17, height: 12 },
    description: 'The hexapod is the flagship Fall Semester project of my club ([Cornell Physical Intelligence](https://cornellphysicalintelligence.com/)). We are working in collaboration with [Cornell Geo Data](https://cornellgeodata.com/) to create a low profile walking robot that can survey forests from the ground up, as opposed to standard methods which use drones to survey from the top down. More generally, my hope with this robot is to create a general purpose "ground drone," which can be used for extremely easy data collection, in the way modern quadcopters operate.\n\nMost hexapod robots are designed with simple hobby servos and hard coded steps. I wanted to raise the standards for this project; all our motors are quasi direct drive (QDD motors often used in humanoid robots) that provide much finer feedback and torque control. The walking gait is trained in Isaac Sim to handle all types of terrain, and our perception stack handles higher level navigation.\n\n[[I personally did the full mechanical design of the robot, and a few minor PCBs.]]',
    image: img(`${hex}RocksHero.webp`, {
      srcSet: `${url(`${hex}RocksHero-960.webp`)} 960w, ${url(`${hex}RocksHero.webp`)} 1800w`,
      sizes: '(max-width: 860px) 60vw, 34vw',
      alt: 'The hexapod climbing over rocks',
    }),
    imageBleed: true,
    // The three designs that came before the one above, oldest first.
    lineage: [
      { ...img(`${hex}LineageServo.webp`),    label: 'long servo legs',        alt: 'First design, a CAD drawing: a hexapod on very long servo driven legs' },
      { ...img(`${hex}Prototype.webp`),       label: '3D printed',             alt: 'Second design: a 3D printed hexapod with a white frame and black legs' },
      { ...img(`${hex}LineageLongLegs.webp`), label: 'this body, longer legs', alt: 'Third design: the aluminium body on longer legs' },
    ],
    galleryTint: '#eef0f3',
    galleryLayout: 'double-feature',
    gallery: [
      video(`${hex}Stairs.mp4`, { autoplay: true, label: 'The learned gait climbing a stair course in simulation' }),
      video(`${hex}LegJump.mp4`, { autoplay: true, label: 'A real leg jumping on its test rail, then replayed at quarter speed' }),
      video(`${hex}Walks.mp4`, { label: 'One simulated robot walking, then the view pulls back to twenty walking differently' }),
      video(`${hex}LegStand.mp4`),
      still(`${hex}LegDetail.webp`),
      still(`${hex}LegOnRail.webp`),
      cutout(`${hex}HexapodCAD.webp`),
    ],
    flip: false,   // [image | text | gallery]
  },
  {
    id: 'veridien',
    layout: 'film',
    title: 'Veridien',
    org: { name: 'Veridien', href: 'https://veridienlabs.org', logo: url('logos/veridien.svg'), width: 12, height: 12 },
    description: '[[Veridien is a startup I co-founded with two other Cornell undergrads]], where we build ultra realistic surgical simulators that use machine learning to grade and advise surgeons. The organs are custom hydrogel that cuts, chars and bleeds, and they can be made from a patient\'s CT or MRI, so residents can practice on many anatomies before they reach the OR.\n\nThree cameras built into the dome track each tool position and create live labels of each operation. The film is our first full myomectomy on the trainer, recorded at 1:30 a.m. in our lab. Next up is a pilot with a residency program in spring 2027. [[I am the CTO.]]',
    flip: true,    // [film and stills | text | cut-out]
    links: [{ label: 'veridienlabs.org', href: 'https://veridienlabs.org' }],
    film: {
      ...video(`${ver}VeridienFilm-720.mp4`),
      label: 'People operating on the Veridien trainer, then the procedure itself with the digital twin and step recognition overlaid',
      // Seconds of the film that are close-ups of the organ. They play blurred until the viewer
      // unticks the box under the film. Re-measure if the film is re-cut (scripts/veridien_film.sh).
      closeups: [[0, 0.8], [9.5, 46.6]],
      // The step panel burned into the film: where it sits (x, y, w, h as fractions of the
      // frame) and when it is up. It is redrawn sharp over the blur.
      panel: { rect: [54 / 1920, 830 / 1080, 443 / 1920, 195 / 1080], times: [[12.0, 17.9], [31.9, 35.8]] },
    },
    // The simulator opening, frame by frame, scrubbed by the scroll (rendered for veridienlabs.org).
    sequence: {
      frame: (i) => url(`${ver}opening/${String(i).padStart(2, '0')}.webp`),
      count: sizes[`${ver}opening`][2],
      width: sizes[`${ver}opening`][0],
      height: sizes[`${ver}opening`][1],
      alt: 'The Veridien simulator: a white dome with laparoscopic instruments, opening to show the organ module inside',
    },
    galleryTint: '#eef2ef',
    gallery: [
      still(`${ver}Operating.webp`, { alt: 'Two of us operating on the trainer in the lab' }),
      still(`${ver}SessionSummary.webp`, { alt: 'The session summary shown after the procedure' }),
    ],
  },
  {
    id: 'helios-x',
    layout: 'photo',
    title: 'Helios X',
    org: { name: 'Picogrid', href: 'https://picogrid.com/', logo: url('logos/picogrid.svg'), width: 75, height: 7, wordmark: true },
    description: 'Helios X is the hardware Picogrid announced as the ECN HX, its high performance Expeditionary C2 Node: a rugged computer in a carry case that connects drones, sensors and vehicles in the field and runs AI models on their feeds on the spot. [[I designed the majority of its hardware.]]\n\nIt is the tan case in the photo. Compared with the Helios before it, it is more than 10 lb lighter and small enough to fit in the old one\'s case, with 7x the AI compute. It is now deployed with the U.S. Army.',
    links: [
      { label: 'Picogrid announcement', href: 'https://picogrid.com/newsroom/picogrid-launches-high-performance-ecns-to-bring-more-computing-power-to-the-tactical-edge' },
      { label: 'LinkedIn post', href: 'https://lnkd.in/p/eXG2UHz7' },
    ],
    photo: {
      ...img(`${helios}Field.webp`, {
        srcSet: `${url(`${helios}Field-1100.webp`)} 1100w, ${url(`${helios}Field.webp`)} 2000w`,
        sizes: '(max-width: 860px) 100vw, 64vw',
      }),
      alt: 'Helios X, a tan rugged case, on desert sand under a camouflage canopy, between a multirotor drone and a fixed-wing aircraft',
      credit: 'Photo: Picogrid',
      // Outline of the case in the photo (viewBox 0 0 1000 437.5). Hovering dims everything else.
      subject: 'M666.4,228.6 L660.7,222.9 L657.9,212.9 L653.6,210.0 L604.3,208.6 L602.1,211.4 L587.9,211.4 L587.1,210.0 L423.6,211.4 L420.0,215.7 L419.3,222.1 L412.9,227.9 L412.9,238.6 L419.3,240.0 L420.0,282.1 L418.6,289.3 L412.1,297.9 L412.1,304.3 L413.6,308.6 L418.6,313.6 L462.9,312.1 L468.6,317.9 L497.1,317.1 L500.0,314.3 L510.7,314.3 L513.6,312.1 L575.7,312.9 L580.7,310.0 L596.4,309.3 L602.9,313.6 L624.3,312.1 L659.3,313.6 L663.6,310.0 L662.1,298.6 L658.6,297.9 L659.3,280.0 L663.6,278.6 L665.7,274.3 L664.3,251.4 L665.0,240.7 L667.1,237.1 Z',
      // How it compares with the Helios before it; shown while hovering.
      specsCaption: 'Compared with the previous Helios',
      specs: [
        { value: '7x', label: 'the AI compute' },
        { value: '10+ lb', label: 'lighter' },
        { value: 'Smaller', label: 'it fits in the old Helios case' },
      ],
    },
  },
  {
    id: 'living-guide',
    title: 'Living Guide',
    subtitle: 'Design Studio Project',
    description: 'Living Guide is a wearable mask that turns other people\'s attention into tactile sensations and physical direction.\n\nThe wearer\'s vision is fully blocked, while five scale strips on the mask respond to how long people look from different directions. When one direction receives more gaze, the motors under that strip move, and the wearer follows that tactile signal and walks toward the gazer.\n\nThe project reflects attention-seeking behavior in contemporary social & social media culture, where attention becomes an invisible force that shapes how we move, perform, and define ourselves.',
    image: img(`${mask}FaceMask.webp`, { alt: 'Living Guide worn over the face' }),
    imageFlush: true,   // the photo is cropped straight down its right side: stand that side on the page edge
    galleryTint: '#f2f2f4',
    galleryLayout: 'featured-left',
    gallery: [
      video(`${mask}MaskMoving.mp4`, { autoplay: true, label: 'Every scale strip on the mask moving' }),
      cutout(`${mask}ExplodedView.webp`),
      toggle(`${mask}MechanismA.webp`, `${mask}MechanismB.webp`),
    ],
    flip: true,
  },
  {
    id: 'plant-bot',
    title: 'Plant Bot',
    subtitle: 'Agentic Plant Care Walking Robot',
    description: 'What if a plant could act as a pet? That was the goal of this project, to make a system that could extend a plant\'s consciousness. [[By mimicking pet behavior through a cute appearance and clever agentic behaviors, I was able to create a companion people would actually want to care for.]] When happy, it would run towards people and be more enthusiastic, and when distressed (not watered or given enough sun) it had the ability to dump out the dirt from the back and mimic a pet soiling itself. Overall, it was a very fun project and [[I got to work on some unique locomotion morphologies.]]',
    image: img(`${plant}CutePlant.webp`),
    galleryTint: '#f2f5f0',
    gallery: [
      cutout(`${plant}RobotCad.webp`),
      cutout(`${plant}ExplodedView.webp`),
      still(`${plant}Used.webp`),
      still(`${plant}Misbehaved.webp`),
      video(`${plant}Walking.mp4`),
      video(`${plant}Autonomy.mp4`),
    ],
    flip: false,
  },
  {
    id: 'gauntlet',
    title: 'Gauntlet',
    subtitle: 'Multimodal XR Input Device',
    description: 'This wearable gauntlet was developed and made in one day for a Makeathon. [[My goal was to have fun with design and challenge myself to make a fully mechanical and analog finger tracking system. I ended up only making two fingers because of the time constraints (along with a clicker on the thumb).]] These three analog input methods combined with an accelerometer allow for a unique combination of input logic. All the joints snap together or are connected with small M2.5 screws, and the ligaments on the back of the hand serve to tension the fingers against the base of the hand to ensure that tracking is smooth.',
    image: img(`${glove}GloveHands.webp`),
    galleryTint: '#edeef3',
    gallery: [
      still(`${glove}FusionGauntlet.webp`),
      still(`${glove}Gauntlet.webp`),
      still(`${glove}HandTesting.webp`),
      still(`${glove}HappyTesting.webp`),
      still(`${glove}WithHandModel.webp`),
      toggle(`${glove}Open.webp`, `${glove}Closed.webp`),
    ],
    flip: true,
  },
  {
    id: 'modular-hydroponics',
    title: 'Modular Hydroponics',
    description: '[[My goal for this project was to make an innovative hydroponics system.]] I prioritized modularity because I wanted my system to be used as a tool for educators to teach about the technology — you could have two branches when teaching students, then put on ten more when you want to grow a larger volume of plants.\n\n[[My favorite part was working on the quick disconnect branch joints.]] The requirements were to support a few plant pots, be easy and intuitive to connect and disconnect, and most importantly, connect water flow to the central water line when attached and cut it off when detached. [[I achieved this by mounting a quick disconnect pipe component to a 3D printed mounting plate, epoxied to a PVC pipe.]]',
    links: [{ label: 'Instructables', href: 'https://www.instructables.com/contest/greenfuture/' }],
    image: img(`${hydro}Hydroponics.webp`),
    galleryTint: '#f0f5f1',
    galleryLayout: 'grid-2x2',
    gallery: [
      still(`${hydro}Image1.webp`),
      still(`${hydro}Image2.webp`),
      still(`${hydro}Image3.webp`),
      still(`${hydro}Image4.webp`),
    ],
    flip: false,
  },
  {
    id: 'autonomous-rover',
    title: 'Autonomous Rover',
    description: 'I was browsing YouTube one day and stumbled upon the URC (University Rover Challenge). I saw some absolutely amazing designs for rovers, and wanted to make one myself as a general purpose data collection rover platform. [[After researching different powertrains and suspension methods, I ended up designing a novel independent front/back rocker system, which removed the need for a linkage bar between the sides of the rover.]]\n\n[[My favorite part of this design was creating the four bar linkage systems for the two sets of front wheels. Using a set of thrust and axial bearings, I overengineered the front wheel mounts to be able to handle hundreds of pounds of shear load.]] Although I never tested them to that limit, I did accidentally perform a stress test while presenting my project at an MIT conference. I was holding the 40-pound rover when I tripped and fell forward, dropping it onto the ground right on its wheels. Nothing broke, so I\'d say it\'s pretty robust.',
    image: img(`${rover}Rover.webp`),
    imageLarge: true,
    galleryTint: '#f0f2f5',
    galleryLayout: 'grid-2x2',
    gallery: [
      still(`${rover}Image1.webp`),
      still(`${rover}Image2.webp`),
      still(`${rover}Image3.webp`),
      still(`${rover}Image4.webp`),
    ],
    flip: true,
  },
]

export default projects
