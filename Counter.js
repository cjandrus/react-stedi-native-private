import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import getSpikesFromAccelerometer from './utils/StepCalculator';
import Bar from './Bar';
import CircularProgress from 'react-native-circular-progress-indicator';


export default function Counter() {
  const data = useRef({
    x: 0,
    y: 0,
    z: 0,
  });
  const startTime = new Date().getTime();
  const [subscription, setSubscription] = useState(null);
  const recentAccelerationData = useRef([]);//useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue). The returned object will persist for the full lifetime of the component.
  const steps = useRef([]);//useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue). The returned object will persist for the full lifetime of the component.
  const [stepCount, setStepCount] = useState(0);
  const previousHighPointTimeRef = useRef(0);//this is the most recent time we had a spike in acceleration, we initialize it to 0 meaning none
  const previousValue = useRef(0);//we process every 20 measurements, and this will be the 20th measurement from the previous time we processed data, start it at 0

  //Android Docs: The data delay (or sampling rate) controls the interval at which sensor events are sent to your application via the onSensorChanged() callback method. The default data delay is suitable for monitoring typical screen orientation changes and uses a delay of 200,000 microseconds. You can specify other data delays, such as SENSOR_DELAY_GAME (20,000 microsecond delay), SENSOR_DELAY_UI (60,000 microsecond delay), or SENSOR_DELAY_FASTEST (0 microsecond delay).
  // https://developer.android.com/guide/topics/sensors/sensors_overview#java

  //Unable to find the default update interval, however the game play rate in Android is 20 millisecond intervals
  const _slow = () => {
    Accelerometer.setUpdateInterval(1000);
  };

  const _fast = () => {
    Accelerometer.setUpdateInterval(100);
  };

  const _subscribe = () => {
    (async () => {
      await Accelerometer.isAvailableAsync(); //this seems to initialize the Accelerometer for Android
    })(); //check if Acceleromoter is available
    setStepCount(0);
    recentAccelerationData.current=[];
    steps.current=[];
    setSubscription( //we set this state variable so later we can use it to unsubscribe
      Accelerometer.addListener((accelerometerData) => {
        data.current=accelerometerData;
        const { x, y, z } = data.current;
        //console.log("x: "+x+" y:"+y+" z:"+z);
        let total_amount_xyz = Math.sqrt(x * x+ y*y + z*z) * 9.81;
        // console.log(new Date().getTime()+","+total_amount_xyz);
        // console.log("Steps: "+steps.current.length);
        recentAccelerationData.current.push({time: new Date().getTime(), value: total_amount_xyz});
        //  console.log("recentAccelerationData.length", recentAccelerationData.current.length);
        if (recentAccelerationData.current.length>20){
          tallyLatestSteps();
        } 
      })
    );
  };

  const tallyLatestSteps= ()=>{
    // console.log("tallyrecentAccelerationData.length", recentAccelerationData.current.length);
    if (recentAccelerationData.current.length > 0){
    // console.log("RecentAccelerationData: "+JSON.stringify(recentAccelerationData.current));
    const {spikes, previousHighPointTime} = getSpikesFromAccelerometer({recentAccelerationData: recentAccelerationData.current, threshold: 11, previousValue: previousValue.current, previousHighPointTime: previousHighPointTimeRef.current});
    previousValue.current = recentAccelerationData.current[recentAccelerationData.current.length-1].value;//store this for when we need to remember the last value
    previousHighPointTimeRef.current = previousHighPointTime;
    // console.log("Spikes: "+JSON.stringify(spikes)+ " with length: "+spikes.length);
    // console.log("Steps before: "+steps.current.length);
    steps.current=steps.current.concat(spikes);
    // console.log("Steps after: "+steps.current.length);
    recentAccelerationData.current=[];
   if( steps.current.length >= 30) {
    console.log("_unsubscribe");
    setStepCount(30);
    _unsubscribe();
   }else{
    setStepCount(steps.current.length);
   }
  
    }
  }

  

  const _unsubscribe = () => {
    // tallyLatestSteps();//count the last remaining steps before unsubscribing
    subscription && subscription.remove();
    Accelerometer.removeAllListeners();
    console.log("_")
    setSubscription(null);
  };

  useEffect(() => {
    //_subscribe();
    steps.current=[];
    Accelerometer.setUpdateInterval(100);
    return () => _unsubscribe();
  }, []);

  const { x, y, z } = data.current;
  //console.log("x: "+x+" y:"+y+" z:"+z);
  let total_amount_xyz = Math.sqrt(x * x+ y*y + z*z) * 9.81;
        
//circula process bar

console.log(stepCount, "stepCount");
  return (
     <View> 
     <Bar/>
     <View style={styles.screen}> 
    <CircularProgress style={styles.button2}
    value={stepCount}
  radius={100}
  duration={1000}
  progressValueColor={'black'}
  maxValue={30}
  title={'Steps'}
  titleColor='#222'
  inActiveStrokeColor = {'#A0CE4E'}
  inActiveStrokeOpacity={0.4}
  titleStyle={{fontWeight: 'bold'}}
/>

        <TouchableOpacity
          onPress={subscription ? _unsubscribe : _subscribe}
          style={styles.button}
        >
          <Text>{subscription ? 'Stop' : 'GO'}</Text>
        </TouchableOpacity>
    
      </View>
      </View>
  
    

  );
}

function round(n) {
  if (!n) {
    return 0;
  }
  return Math.floor(n * 100) / 100;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center"
  },

  button: {
    marginTop: 15,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 100,
    backgroundColor: '#fc9c54',

  },
  button2:{
   paddingTop:50
    // justifyContent: "center",
    // alignItems: "center",
  }
  

});
