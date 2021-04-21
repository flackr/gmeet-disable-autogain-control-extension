(function() {
    function setLegacyChromeConstraint(constraint, name, value) {
        if (constraint.mandatory && name in constraint.mandatory) {
            constraint.mandatory[name] = value;
            return;
        }
        if (constraint.optional) {
            const element = constraint.optional.find(opt => name in opt);
            if (element) {
                element[name] = value;
                return;
            }
        }
        // `mandatory` options throw errors for unknown keys, so avoid that by
        // setting it under optional.
        if (!constraint.optional) {
            constraint.optional = [];
        }
        constraint.optional.push({ [name]: value });
    }
    function setConstraint(constraint, name, value) {
        if (constraint.advanced) {
            const element = constraint.advanced.find(opt => name in opt);
            if (element) {
                element[name] = value;
                return;
            }
        }
        constraint[name] = value;
    }
    function disableAudioProcessing(constraints) {
        var disableConstraints = ['echoCancellation', 'googEchoCancellation', 'googAutoGainControl', 'googAutoGainControl2', 'googNoiseSuppression', 'googHighpassFilter', 'googTypingNoiseDetection'];
        console.log("Automatically unsetting audio processing constraints!", constraints);
        if (constraints && constraints.audio) {
            if (typeof constraints.audio !== "object") {
                constraints.audio = {};
            }
            if (constraints.audio.optional || constraints.audio.mandatory) {
                for (let disableConstraint of disableConstraints) {
                    setLegacyChromeConstraint(constraints.audio, disableConstraint, false);
                }
            } else {
                for (let disableConstraint of disableConstraints) {
                    setConstraint(constraints.audio, disableConstraint, false);
                }
            }
        }
    }

    function patchFunction(object, name, createNewFunction) {
        if (name in object) {
            var original = object[name];
            object[name] = createNewFunction(original);
        }
    }

    patchFunction(navigator.mediaDevices, "getUserMedia", function (original) {
        return function getUserMedia(constraints) {
            disableAudioProcessing(constraints);
            return original.call(this, constraints);
        };
    });
    function patchDeprecatedGetUserMedia(original) {
        return function getUserMedia(constraints, success, error) {
            disableAudioProcessing(constraints);
            return original.call(this, constraints, success, error);
        };
    }
    patchFunction(navigator, "getUserMedia", patchDeprecatedGetUserMedia);
    patchFunction(navigator, "mozGetUserMedia", patchDeprecatedGetUserMedia);
    patchFunction(navigator, "webkitGetUserMedia", patchDeprecatedGetUserMedia);
    patchFunction(MediaStreamTrack.prototype, "applyConstraints", function (original) {
        return function applyConstraints(constraints) {
            disableAudioProcessing(constraints);
            return original.call(this, constraints);
        };
    });
    console.log(
        "Disable audio processing based on extension by Joey Watts!",
        navigator.mediaDevices.getUserMedia
    );
})();
