const BAR_COUNT = 8;

/**
 * Returns the average of the elements in the array between the given bounds
 */
function subArrayAverage(arr, from, to) {
    let sum = 0;
    for (let i = from; i <= to; i++) {
        sum += arr[i];
    }

    return sum / ((to - from) + 1);
}

/**
 * The frequencey analyzer returns the frequency data in a linear scale along
 * the X axis. Something that looks like this:
 * 
 * (Lets assume the number of frequency bins returned by the analyzer is 256)
 * 
 * ------------------------------------------------------
 *     0    32    64    96   128   160   192   224   256
 * ------------------------------------------------------
 *     ^     ^     ^     ^     ^     ^     ^     ^     ^
 * 
 * But musical notes are laid out in a logarithmic scale.
 * For example, A1 = 55Hz, A2 = 110Hz, A3 = 220Hz, A4 = 440Hz and so on.
 * 
 * This means we need a scale that looks like this instead:
 * 
 * ------------------------------------------------------
 *     0     2     4     8    16    32    64   128   256
 * ------------------------------------------------------
 *     ^     ^     ^     ^     ^     ^     ^     ^     ^
 * 
 * To achieve this, we first take the Log2 of the full range (256) which is 8.
 * We divide the Log2 value equally (based on number of output bars required).
 * If we consider 8 bars, this would give a nice 1 interval between bars
 * 
 * ------------------------------------------------------
 *     0     1     2     3     4     5     6     7     8
 * ------------------------------------------------------
 *     ^     ^     ^     ^     ^     ^     ^     ^     ^
 * 
 * Then simply raise each value to the power of 2 to get the expected log scale.
 * This method returns an array containing the X coordinates. (a total of
 * bar count + 1). The nth bar should contain values between ranges n and n+1
 */
function getRanges(length, barCount) {
    const base2Interval = Math.log2(length) / barCount;
    return Array.from(new Array(barCount + 1),
        (e, i) => Math.floor(Math.pow(2, i * base2Interval)) - 1
    );
}

/**
 * The perceived audio loudness is also in log base 10 of the actual amplitude.
 * Source: trust me bro :P
 * I am not sure exactly if this would work, so I am still working on this.
 */
function adjustAmplitude(value) {
    return (Math.pow(10, value) / 10) - 0.1
}

const App = {
    data() {
        const context = new AudioContext();

        const analyzerNode = context.createAnalyser();
        analyzerNode.fftSize = 1024;
        analyzerNode.smoothingTimeConstant = 0.8;
        analyzerNode.connect(context.destination);

        const bufferLength = analyzerNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
    
        return {
            bars: new Array(BAR_COUNT).fill(0).map(e => ({ value: e })),
            context,
            analyzerNode,
            dataArray,
            ranges: getRanges(bufferLength, BAR_COUNT),
            source: undefined,
        }
    },

    mounted() {
        this.source = this.context.createMediaElementSource(this.$refs.audio);
        this.source.connect(this.analyzerNode);
        this.draw();
    },

    methods: {
        play() {
            this.context.resume();
        },
        draw() {
            requestAnimationFrame(this.draw);
            this.analyzerNode.getByteFrequencyData(this.dataArray);

            this.bars.forEach((bar, i) => {
                const start = this.ranges[i];
                const end = this.ranges[i + 1];
                const value = subArrayAverage(this.dataArray, start, end) / 256;

                bar.value = adjustAmplitude(value);
            });
        }
    }
}

const app = Vue.createApp(App).mount('#app');