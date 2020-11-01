// Make the emojis look wicked cool but don't lose sleep over it
try {
    twemoji.parse(document);
}
catch {
    // Dang, oh well
}

// Represents one individual bar in the graphs
class barNum {
    index;
    width;
    number;
    element;
    graph;
    constructor(number, index, width, graph) {
        this.width=width;
        this.index=index;
        this.number=number;
        this.graph=graph;
        this.element = document.createElement('div');
        this.element.classList.add('bar');
        this.element.style.width=width;
        this.element.style.height=`calc(${Math.round(number)}%)`;
        // this.element.style.left=`calc(${index} * ${width})`;
        this.setIndex(index);
        graph.appendChild(this.element);
    }
    setIndex(newIndex) {
        this.index=newIndex;
        this.element.style.left=`calc(${newIndex} * ${this.width})`;
    }
    highLight(undo) {
        if (!undo) {
            this.element.classList.add('highlight');
        }
        else {
            this.element.classList.remove('highlight');
        }
    }
    group(undo) {
        if (!undo) {
            this.element.classList.add('group');
        }
        else {
            this.element.classList.remove('group');
        }
    }
    clear() {
        this.highLight(true);
        this.group(true);
    }
}

// Class for a specific sort box
class sortBox {
    // Where to draw things
    mainBox;
    // Array of numbers
    numbers;
    // Length
    length;
    // Step button
    stepButton;
    // Run button
    runButton;
    // One step
    callback;

    // Number of steps
    iterations;

    // Max number of iterations, to prevent horrible mistakes
    stopNum;

    // All buttons
    allButtons;

    /**
     * 
     * @param {string} id of the HTML element to make into a bar graph
     * @param {number} length of the array of numbers. i.e. how many bars?
     * @param {(Array,number)=>Promise} callback function for each individual step of the algorithm. Async to allow illustrative pauses.
     * @param {number} stopNum maximum number of allowed iterations
     */
    constructor(id, length, callback, stopNum=50) {
        this.stopNum=stopNum;
        this.callback=callback;
        this.mainBox = document.querySelector(`#${id}`);
        this.length=length;
        this.numbers=[];
        this.iterations=0;
        const widths = `${100/length}%`;
        for (let i=0;i<length;i++) {
            const newNumber = new barNum(this.randomNumber(),i,widths,this.mainBox);
            this.numbers.push(newNumber);
        }

        this.allButtons=[];

        this.stepButton = this.mainBox.querySelector('.step');
        if (this.stepButton) {
            this.allButtons.push(this.stepButton);
            this.stepButton.addEventListener('click',()=>this.step());
        }
        this.runButton = this.mainBox.querySelector('.run');
        if (this.runButton) {
            this.allButtons.push(this.runButton);
            this.runButton.addEventListener('click',()=>this.run());
        }
        this.shuffleButton = this.mainBox.querySelector('.shuffle');
        if (this.shuffleButton) {
            this.allButtons.push(this.shuffleButton);
            this.shuffleButton.addEventListener('click',()=>this.shuffle())
        }
    }

    shuffle() {
        this.iterations=0;
        for(let i=0;i<this.numbers.length;i++) {
            const randomIndex = Math.floor((this.numbers.length-i) * Math.random());
            const scratch = this.numbers[i];
            this.numbers[i] = this.numbers[randomIndex];
            this.numbers[randomIndex] = scratch;
        }
        this.numbers.forEach((num,i)=>num.setIndex(i));
    }

    randomNumber() {
        return Math.floor(100 * Math.random())+1;
    }

    removeStyles() {
        this.numbers.forEach(num=>{
            num.highLight(true);
            num.group(true);
        });
    }

    // Run one step
    async step() {
        if (this.callback) {
            // Disables buttons
            this.allButtons.forEach(button=>button.setAttribute("disabled","true"));

            let success=await this.callback(this.numbers,this.iterations);
            this.iterations++;
            // Enable buttons again
            this.allButtons.forEach(button=>button.removeAttribute("disabled"));

            return success;
        }
        else {
            return false;
        }
    }

    // Run until done
    async run() {
        let keepGoing=true;
        let limited = this.stopNum;
        while(keepGoing && limited>0) {
            limited--;
            keepGoing = await this.step();
        }
        this.removeStyles();
    }
}

// Quicksort!
// I did not see an easy way to break this into steps, so the whole thing just runs
const quickSort = async (numbers,iterations,zeroIndex=0) => {
    if (numbers.length<=1) {
        return numbers;
    }
    const pivot = numbers[Math.floor(numbers.length/2)];
    numbers.forEach((num)=>num.group());
    pivot.highLight();
    const lowerArr=[];
    const higherArr=[];
    await new Promise(resolve=>setTimeout(resolve,400));
    numbersCopy=[...numbers];
    while(numbers.length>0) {numbers.pop()};
    numbersCopy.forEach((num,i)=>{
        if (num===pivot) {return;}
        num.group();
        if (num.number < pivot.number) {
            lowerArr.push(num);
        }
        else {
            higherArr.push(num);
        }
    });
    
    // Fuck splice
    lowerArr.forEach(num=>{
        numbers.push(num);
    });
    numbers.push(pivot);
    higherArr.forEach(num=>{
        numbers.push(num);
    });

    numbers.forEach((num,i)=>{
        num.setIndex(i+zeroIndex);
    });
    
    await new Promise(resolve=>setTimeout(resolve,400));

    numbers.forEach(num=>num.clear());
    await new Promise(resolve=>setTimeout(resolve,200));

    const lowerSorted = await quickSort(lowerArr,iterations,zeroIndex);
    const upperSorted = await quickSort(higherArr,iterations,zeroIndex+lowerArr.length+1);

    while(numbers.length>0) {
        numbers.pop();
    }
    lowerSorted.forEach(num=>numbers.push(num));
    numbers.push(pivot);
    upperSorted.forEach(num=>numbers.push(num));
    return numbers;
}

const unsorted = new sortBox('noSort',20);
const quickSortBox = new sortBox('quickSort',69,quickSort);
// Bubbles :)
const bubbleSort = new sortBox('bubbleSort',20,
    async (numbers,iterations)=>{
        let changed=false;
        for (let i=0;i<numbers.length-1-iterations;i++) {
            const numOne = numbers[i];
            const numTwo = numbers[i+1];
            if (numOne.number > numTwo.number) {
                const scratch = numOne;
                numOne.highLight();
                numbers.splice(i,1);
                numbers.splice(i+1,0,scratch);
                numOne.setIndex(i+1);
                numTwo.setIndex(i);
                changed=true;
            }
            else {
                numTwo.highLight();
            }
            await new Promise(resolve=>setTimeout(resolve,200));
            numOne.highLight(true);
            numTwo.highLight(true);
        }
        return changed;
    }
);

// Cocktail sort!
const cocktailSort = new sortBox('cocktailSort',20,
    async (numbers,iterations)=>{
        let changed=false;
        for (let i=iterations;i<numbers.length-1-iterations;i++) {
            const numOne = numbers[i];
            const numTwo = numbers[i+1];
            if (numOne.number > numTwo.number) {
                const scratch = numOne;
                numOne.highLight();
                numbers.splice(i,1);
                numbers.splice(i+1,0,scratch);
                numOne.setIndex(i+1);
                numTwo.setIndex(i);
                changed=true;
            }
            else {
                numTwo.highLight();
            }
            await new Promise(resolve=>setTimeout(resolve,200));
            numOne.highLight(true);
            numTwo.highLight(true);
        }
        for (let i=numbers.length-1-iterations;i>iterations;i--) {
            const numOne = numbers[i];
            const numTwo = numbers[i-1];
            if (numOne.number < numTwo.number) {
                const scratch = numOne;
                numOne.highLight();
                numbers.splice(i,1);
                numbers.splice(i-1,0,scratch);
                numOne.setIndex(i-1);
                numTwo.setIndex(i);
                changed=true;
            }
            else {
                numTwo.highLight();
            }
            await new Promise(resolve=>setTimeout(resolve,200));
            numOne.highLight(true);
            numTwo.highLight(true);
        }
        return changed;
    }
);

// Insertion sort!
const insertSort = new sortBox('insertSort',20,
    async (numbers,iterations)=>{
        let found=false;
        for (let i=0;i<Math.min(iterations,numbers.length);i++) {
            if (iterations >= numbers.length) {
                break;
            }
            const numToInsert = numbers[iterations];
            numToInsert.highLight();
            const compareNum = numbers[i];
            compareNum.highLight();
            if (numToInsert.number < compareNum.number) {
                const scratch = numToInsert;
                numbers.splice(iterations,1);
                numbers.splice(i,0,scratch);
                numbers.forEach((num,i)=>num.setIndex(i));
                found=true;
            }
            await new Promise(resolve=>setTimeout(resolve,200));
            numToInsert.highLight(true);
            compareNum.highLight(true);
            if (found) {
                break;
            }
        }
        return iterations < numbers.length;
    }
);


// Merge sort. A bit buggy but usually works out in the end
const subLists=[];
const mergeSort = new sortBox('mergeSort',20,
    async (numbers, iterations)=>{
        if (subLists.length===0) {
            numbers.forEach(num=>subLists.push([num]));
        }
        let index=0;
        while(index < subLists.length-1) {
            const list1 = subLists[index];
            const startIndex=list1[0].index;
            const list2 = subLists[index+1];
            let i=0;
            while(list2.length>0) {
                const item1=list1[i];
                const item2=list2[0];
                if (i<list1.length) {
                    item1.highLight();
                    item2.highLight();
                    await new Promise(resolve=>setTimeout(resolve,100));
                    if (list1[i].number>list2[0].number && list2.length>0) {
                        list1.splice(i,0,list2.shift());
                    }
                    i++;
                    list1.forEach((num,i)=>{
                        num.setIndex(startIndex+i);
                    })
                    await new Promise(resolve=>setTimeout(resolve,200));
                    item1.clear();
                    item2.clear();
                }
                else {
                    list1.push(list2.pop());
                }
            }
            index+=2;
        }
        for(let i=subLists.length-1;i>=0;i--) {
            if (subLists[i].length===0) {
                subLists.splice(i,1);
            }
        }
        let keepGoing=subLists.length > 1;

        if (!keepGoing) {
            while(subLists.length>0) {
                subLists.pop();
            }
        }
        return keepGoing;
    }
);

// Bogosort! Obviously the best one
const bogoSort = new sortBox('bogoSort',6,
    async (numbers,iterations)=>{
        let found=true;
        // Check if it is in order already
        for (let i=1;i<numbers.length;i++) {
            if (numbers[i].number < numbers[i-1].number) {
                found=false;
                await new Promise(resolve=>setTimeout(resolve,200));
                break;
            }
        }
        if (!found) {
            // Shuffle it
            const copy = [];
            while(numbers.length>0) {
                copy.push(numbers.pop());
            }

            while(copy.length>0) {
                const index = Math.floor(Math.random() * copy.length);
                numbers.push(copy.splice(index,1)[0]);
            }
        }
        numbers.forEach((num,i)=>num.setIndex(i));
                
        return !found;
    }
,Infinity);