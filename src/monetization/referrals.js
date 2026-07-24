function sanitizeUsername(value) {
  const normalized=String(value||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"").slice(0,40);
  return normalized||"lifter";
}

function safeOrigin(value) {
  try{
    const url=new URL(String(value||""));
    if(url.protocol!=="https:"&&url.protocol!=="http:") throw new Error("Unsupported protocol");
    return url.origin;
  }catch{
    return "https://lift-tracker.app";
  }
}

export function buildReferralLink({origin,username}) {
  const url=new URL("/",safeOrigin(origin));
  url.searchParams.set("ref",sanitizeUsername(username));
  return url.toString();
}

export function buildReferralShare({origin,username}) {
  const cleanUsername=sanitizeUsername(username);
  return {
    title:"Train with me on Earned",
    text:`Join @${cleanUsername} on Earned and keep each other accountable in the gym.`,
    url:buildReferralLink({origin,username:cleanUsername}),
  };
}
