// Extracted from imu.html lines 3283-3400
        // Global variables
        let currentQuestion = 1;
        let currentSubject = 'physics';
        let currentImageIndex = 0;
        let manualImageChange = false; // Track if user manually changed image
        let isSubjectSwitching = false; // Track if switching subjects via tabs
        let timerInterval;
        let totalSeconds = 180 * 60;
        let startTime = new Date();
        let questionStartTime = new Date();
        let testStarted = false;
        let testSubmitted = false;
        
        // Subject state memory - remember last position for each subject
        let subjectMemory = {
            physics: { lastQuestion: 1, lastImageIndex: 0 },
            maths: { lastQuestion: null, lastImageIndex: 0 },
            chemistry: { lastQuestion: null, lastImageIndex: 0 }
        };
        
        // User configuration
        let userName = "";
        let testName = "";
        let testType = "full";
        let physicsCount = 25;
        let mathsCount = 25;
        let chemistryCount = 25;
        let totalQuestions = 75;
        let customTime = 180;
        
        // Answer storage arrays
        let physicsAnswers = [];
        let mathsAnswers = [];
        let chemistryAnswers = [];

        // ===== JSON/TXT MODE =====
        let jsonModeEnabled = false;
        let jsonQuestions = { physics: [], maths: [], chemistry: [] };
        // Each question: { q, options (optional), answer, type: 'mcq'|'numeric' }
        
        // Marked for review arrays
        let physicsMarked = [];
        let mathsMarked = [];
        let chemistryMarked = [];
        
        // Time spent per question
        let timeSpent = [];
        
        // Loaded images from folders (using File API)
        let loadedPhysicsImages = [];
        let loadedMathsImages = [];
        let loadedChemistryImages = [];
        
        // Loaded answer images
        let loadedPhysicsAnswers = [];
        let loadedMathsAnswers = [];
        let loadedChemistryAnswers = [];
        
        // Loaded answer txt keys (auto-fill)
        let physicsTxtAnswerKey = '';  // combined string from all txt files
        let mathsTxtAnswerKey = '';
        let chemistryTxtAnswerKey = '';
        
        // Auto-advance toggle state
        let autoAdvanceImage = false;
        
        // Filename-based answer key mode
        let filenameAnsMode = false;
        
        // ===== FOLDER BATCH SYSTEM =====
        // Each batch: { images: [{name, dataURL}], answerKey: "ABCD..." (parsed from txt), label: "Folder Name" }
        let folderBatches = { physics: [], maths: [], chemistry: [] };
        
        // Subject-wise timer mode
        let subjectTimerMode = false;
        let subjectTimerSeconds = { physics: 0, maths: 0, chemistry: 0 };
        let currentSubjectSeconds = 0;  // timer for current subject
        let subjectTimerLocked = { physics: false, maths: false, chemistry: false }; // locked when time up
        
        // Answer keys (for scoring)
        let physicsKey = [];
        let mathsKey = [];
        let chemistryKey = [];
        
        // ===== NUMERIC QUESTION SUPPORT =====
        // Parsed question types from answer key txt
        let physicsQuestionTypes = [];  // array of objects: {type: "mcq"|"numeric", answer: "A"|"33"}
        let mathsQuestionTypes = [];
        let chemistryQuestionTypes = [];
        // Current numeric input buffer
        let currentNumericBuffer = "";
        
        // Images per subject (multiple questions per image)
        let physicsImages = [];
        let mathsImages = [];
        let chemistryImages = [];
        
        // Answer key images
        let physicsAnswerImages = [];
        let mathsAnswerImages = [];
        let chemistryAnswerImages = [];
        
        // Questions per image (how many questions in each image)
        let questionsPerImage = 10; // Default: 10 questions per image
        
        // Test History Array
        let testHistory = [];

        // Current test data for saving to history
        let currentTestData = null;

        // ===== BEHAVIOUR TRACKER =====
        let behaviourTrackerEnabled = false;
        let behaviourLog = []; // Array of event objects
        // Event types: 'navigate', 'select', 'deselect'
        // Each: { time (ms since test start), elapsed (sec on this visit), qNo, subject, sqNo,
        //         type, fromQ (for navigate), option (for select/deselect), answerAtLeave }
        

