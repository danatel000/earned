const PROVIDER_LABELS = Object.freeze({
  apple_health:"Apple Health",
  health_connect:"Health Connect",
  wearable_api:"Wearable",
});

const finiteInRange=(value,min,max)=>{
  const number=Number(value);
  return Number.isFinite(number)&&number>=min&&number<=max?number:null;
};

export function createEmptyRecoverySnapshot() {
  return {
    connected:false,
    provider:null,
    collectedAt:null,
    sleepHours:null,
    hrvMs:null,
    restingHeartRate:null,
    readinessScore:null,
  };
}

export function normalizeRecoverySnapshot(value) {
  if(!value||typeof value!=="object"||!PROVIDER_LABELS[value.provider]||value.connected!==true){
    return createEmptyRecoverySnapshot();
  }
  const parsedDate=typeof value.collectedAt==="string"?new Date(value.collectedAt):null;
  const collectedAt=parsedDate&&!Number.isNaN(parsedDate.getTime())?parsedDate.toISOString():null;
  return {
    connected:true,
    provider:value.provider,
    collectedAt,
    sleepHours:finiteInRange(value.sleepHours,0,24),
    hrvMs:finiteInRange(value.hrvMs,1,300),
    restingHeartRate:finiteInRange(value.restingHeartRate,25,250),
    readinessScore:finiteInRange(value.readinessScore,0,100),
  };
}

export function createUnavailableRecoveryProvider(kind) {
  const label=PROVIDER_LABELS[kind]||"Wearable";
  return Object.freeze({
    id:kind,
    label,
    isAvailable:false,
    status:"not_connected",
    async connect(){
      return {ok:false,code:"not_available",message:`${label} integration is not available in this web app yet.`};
    },
    async readSnapshot(){
      return createEmptyRecoverySnapshot();
    },
  });
}

export function buildAdaptiveTrainingContext({history=[],goals={},recovery}={}) {
  const normalizedRecovery=normalizeRecoverySnapshot(recovery);
  const hasRecoverySignal=[
    normalizedRecovery.sleepHours,
    normalizedRecovery.hrvMs,
    normalizedRecovery.restingHeartRate,
    normalizedRecovery.readinessScore,
  ].some(value=>value!==null);
  return {
    historyCount:Array.isArray(history)?history.length:0,
    latestWorkoutDate:Array.isArray(history)&&history.length?history[history.length-1]?.date||null:null,
    goalCount:goals&&typeof goals==="object"?Object.keys(goals).length:0,
    recovery:normalizedRecovery,
    canAdapt:normalizedRecovery.connected&&hasRecoverySignal,
    recommendation:null,
  };
}
