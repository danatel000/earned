const COLORS={
  lime:0x9dff00,
  cyan:0x54d8ff,
  coral:0xff5a5f,
  white:0xf4f7f5,
  graphite:0x52605a,
};

export function createStrengthSculpture(THREE,budget){
  const root=new THREE.Group();
  const geometries=[];
  const materials=[];
  const plateStacks=[];
  const plateRims=[];
  const plateGrooves=[];
  const hubBolts=[];
  const collarRidges=[];
  const progressRings=[];
  const loadPaths=[];
  const forcePulses=[];
  const ghosts=[];
  const particles=[];
  const measurementBrackets=[];
  const floatingDumbbells=[];

  const geometry=value=>{geometries.push(value);return value;};
  const material=value=>{materials.push(value);return value;};
  const meshMaterial=(color,opacity=1,wireframe=false)=>material(new THREE.MeshBasicMaterial({
    color,
    transparent:opacity<1,
    opacity,
    wireframe,
    depthWrite:opacity>=0.9,
    blending:opacity<0.7?THREE.AdditiveBlending:THREE.NormalBlending,
  }));
  const lineMaterial=(color,opacity=1)=>material(new THREE.LineBasicMaterial({
    color,
    transparent:true,
    opacity,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
  }));

  const steel=meshMaterial(COLORS.white,0.84);
  const steelWire=meshMaterial(COLORS.white,0.4,true);
  const limeFill=meshMaterial(COLORS.lime,0.3);
  const limeWire=meshMaterial(COLORS.lime,0.82,true);
  const cyanWire=meshMaterial(COLORS.cyan,0.68,true);
  const coralWire=meshMaterial(COLORS.coral,0.62,true);
  const graphite=meshMaterial(COLORS.graphite,0.38,true);
  const limeLine=lineMaterial(COLORS.lime,0.72);
  const cyanLine=lineMaterial(COLORS.cyan,0.66);
  const coralLine=lineMaterial(COLORS.coral,0.48);

  const shaftGeometry=geometry(new THREE.CylinderGeometry(0.09,0.09,7.35,28));
  const shaft=new THREE.Mesh(shaftGeometry,steel);
  shaft.rotation.z=Math.PI/2;
  root.add(shaft);
  const shaftOutline=new THREE.Mesh(shaftGeometry,steelWire);
  shaftOutline.rotation.z=Math.PI/2;
  shaftOutline.scale.set(1.012,1.16,1.16);
  root.add(shaftOutline);

  const knurlGeometry=geometry(new THREE.TorusGeometry(0.103,0.006,4,12));
  const knurlPositions=[];
  for(const [start,end,step] of [[-1.92,-0.44,0.065],[0.44,1.92,0.065],[-0.22,0.22,0.07]]){
    for(let position=start;position<=end;position+=step) knurlPositions.push(position);
  }
  const knurl=new THREE.InstancedMesh(knurlGeometry,cyanWire,knurlPositions.length);
  const dummy=new THREE.Object3D();
  knurlPositions.forEach((position,index)=>{
    dummy.position.set(position,0,0);
    dummy.rotation.set(0,Math.PI/2,0);
    dummy.scale.setScalar(index%3===0?1.05:1);
    dummy.updateMatrix();
    knurl.setMatrixAt(index,dummy.matrix);
  });
  knurl.instanceMatrix.needsUpdate=true;
  root.add(knurl);

  for(const direction of [-1,1]){
    for(let strand=0;strand<4;strand+=1){
      const points=[];
      for(let index=0;index<=72;index+=1){
        const ratio=index/72;
        const x=direction<0?-1.92+(ratio*1.48):0.44+(ratio*1.48);
        const angle=(ratio*Math.PI*10*direction)+(strand*Math.PI/2);
        points.push(new THREE.Vector3(x,Math.cos(angle)*0.112,Math.sin(angle)*0.112));
      }
      const helixGeometry=geometry(new THREE.BufferGeometry().setFromPoints(points));
      root.add(new THREE.Line(helixGeometry,strand%2===0?cyanLine:limeLine));
    }
  }

  const sleeveGeometry=geometry(new THREE.CylinderGeometry(0.145,0.145,0.82,32));
  const collarGeometry=geometry(new THREE.CylinderGeometry(0.245,0.245,0.24,32));
  const lockGeometry=geometry(new THREE.TorusGeometry(0.25,0.024,8,32));
  const collarRidgeGeometry=geometry(new THREE.TorusGeometry(0.163,0.009,5,28));
  for(const side of [-1,1]){
    const sleeve=new THREE.Mesh(sleeveGeometry,graphite);
    sleeve.rotation.z=Math.PI/2;
    sleeve.position.x=side*2.24;
    root.add(sleeve);
    const collar=new THREE.Mesh(collarGeometry,cyanWire);
    collar.rotation.z=Math.PI/2;
    collar.position.x=side*2.47;
    root.add(collar);
    const lock=new THREE.Mesh(lockGeometry,steel);
    lock.rotation.y=Math.PI/2;
    lock.position.x=side*2.53;
    root.add(lock);
    for(let ridgeIndex=0;ridgeIndex<7;ridgeIndex+=1){
      const ridge=new THREE.Mesh(collarRidgeGeometry,ridgeIndex%3===0?limeWire:cyanWire);
      ridge.rotation.y=Math.PI/2;
      ridge.position.x=side*(1.92+(ridgeIndex*0.085));
      root.add(ridge);
      collarRidges.push(ridge);
    }
  }

  const plateDefinitions=[
    {radius:0.82,width:0.17,color:"cyan"},
    {radius:1.04,width:0.2,color:"lime"},
    {radius:1.24,width:0.23,color:"coral"},
  ];
  const edgeMarkGeometry=geometry(new THREE.BoxGeometry(0.038,0.075,0.018));
  const hubBoltGeometry=geometry(new THREE.SphereGeometry(0.026,7,5));
  for(const side of [-1,1]){
    plateDefinitions.forEach((definition,index)=>{
      const group=new THREE.Group();
      const baseX=side*(2.66+(index*0.245));
      group.position.x=baseX;
      const plateGeometry=geometry(new THREE.CylinderGeometry(
        definition.radius,definition.radius,definition.width,64,2,false,
      ));
      const bodyMaterial=definition.color==="coral"?coralWire:definition.color==="cyan"?cyanWire:limeFill;
      const plateBody=new THREE.Mesh(plateGeometry,bodyMaterial);
      plateBody.rotation.z=Math.PI/2;
      group.add(plateBody);
      const plateWire=new THREE.Mesh(plateGeometry,definition.color==="coral"?coralWire:limeWire);
      plateWire.rotation.z=Math.PI/2;
      plateWire.scale.set(1.012,1.012,1.012);
      group.add(plateWire);

      const rimGeometry=geometry(new THREE.TorusGeometry(definition.radius*0.97,0.026+(index*0.007),7,64));
      for(const face of [-1,1]){
        const rim=new THREE.Mesh(rimGeometry,definition.color==="coral"?coralWire:limeWire);
        rim.rotation.y=Math.PI/2;
        rim.position.x=face*(definition.width*0.53);
        group.add(rim);
        plateRims.push(rim);
      }

      const hubGeometry=geometry(new THREE.CylinderGeometry(0.23+(index*0.02),0.23+(index*0.02),definition.width*1.12,32));
      const hub=new THREE.Mesh(hubGeometry,index===0?steel:cyanWire);
      hub.rotation.z=Math.PI/2;
      group.add(hub);

      for(const face of [-1,1]){
        for(let grooveIndex=0;grooveIndex<4;grooveIndex+=1){
          const grooveRadius=definition.radius*(0.4+(grooveIndex*0.145));
          const grooveGeometry=geometry(new THREE.TorusGeometry(grooveRadius,0.008+(grooveIndex*0.002),5,52));
          const groove=new THREE.Mesh(grooveGeometry,grooveIndex%2===0?cyanWire:limeWire);
          groove.rotation.y=Math.PI/2;
          groove.position.x=face*(definition.width*0.59);
          group.add(groove);
          plateGrooves.push(groove);
        }
      }

      const boltsPerFace=index===2?10:8;
      const bolts=new THREE.InstancedMesh(hubBoltGeometry,index===2?coralWire:steel,boltsPerFace*2);
      let boltInstance=0;
      for(const face of [-1,1]){
        for(let boltIndex=0;boltIndex<boltsPerFace;boltIndex+=1){
          const boltAngle=(boltIndex/boltsPerFace)*Math.PI*2;
          dummy.position.set(
            face*(definition.width*0.66),
            Math.cos(boltAngle)*(0.29+(index*0.025)),
            Math.sin(boltAngle)*(0.29+(index*0.025)),
          );
          dummy.rotation.set(0,0,0);
          dummy.scale.setScalar(index===2?1.18:1);
          dummy.updateMatrix();
          bolts.setMatrixAt(boltInstance,dummy.matrix);
          boltInstance+=1;
        }
      }
      bolts.instanceMatrix.needsUpdate=true;
      group.add(bolts);
      hubBolts.push(bolts);

      const spokePositions=[];
      for(let spoke=0;spoke<budget.spokeCount;spoke+=1){
        const angle=(spoke/budget.spokeCount)*Math.PI*2;
        const inner=0.29;
        const outer=definition.radius*0.88;
        const x=side*(definition.width*0.58);
        spokePositions.push(
          x,Math.cos(angle)*inner,Math.sin(angle)*inner,
          x,Math.cos(angle)*outer,Math.sin(angle)*outer,
        );
      }
      const spokeGeometry=geometry(new THREE.BufferGeometry());
      spokeGeometry.setAttribute("position",new THREE.Float32BufferAttribute(spokePositions,3));
      const spokes=new THREE.LineSegments(spokeGeometry,index===2?coralLine:cyanLine);
      group.add(spokes);

      const edgeMarks=new THREE.InstancedMesh(edgeMarkGeometry,index===2?coralWire:limeWire,budget.spokeCount);
      for(let mark=0;mark<budget.spokeCount;mark+=1){
        const angle=(mark/budget.spokeCount)*Math.PI*2;
        dummy.position.set(side*(definition.width*0.62),Math.cos(angle)*definition.radius*0.96,Math.sin(angle)*definition.radius*0.96);
        dummy.rotation.set(angle,0,Math.PI/2);
        dummy.scale.set(1,1+(index*0.18),1);
        dummy.updateMatrix();
        edgeMarks.setMatrixAt(mark,dummy.matrix);
      }
      edgeMarks.instanceMatrix.needsUpdate=true;
      group.add(edgeMarks);

      root.add(group);
      plateStacks.push({group,side,baseX,index,radius:definition.radius});
    });
  }

  [1.42,1.8,2.18,2.56].forEach((radius,index)=>{
    const ringGeometry=geometry(new THREE.TorusGeometry(radius,0.012+(index*0.004),5,96));
    const ring=new THREE.Mesh(ringGeometry,index%2===0?cyanWire:limeWire);
    ring.rotation.set((Math.PI/2)+(index*0.18),index*0.24,index*0.3);
    root.add(ring);
    progressRings.push(ring);
  });

  const dumbbellHandleGeometry=geometry(new THREE.CylinderGeometry(0.064,0.064,1.24,14));
  const dumbbellCollarGeometry=geometry(new THREE.CylinderGeometry(0.11,0.11,0.2,12));
  const dumbbellHeadGeometry=geometry(new THREE.CylinderGeometry(0.31,0.31,0.3,8,1,false));
  const dumbbellCapGeometry=geometry(new THREE.CylinderGeometry(0.23,0.25,0.1,8,1,false));
  const dumbbellRingGeometry=geometry(new THREE.TorusGeometry(0.255,0.018,4,8));
  const dumbbellKnurlGeometry=geometry(new THREE.TorusGeometry(0.07,0.007,4,10));
  const dumbbellMaterials=[
    meshMaterial(COLORS.cyan,0.64,true),
    meshMaterial(COLORS.lime,0.7,true),
    meshMaterial(COLORS.coral,0.58,true),
  ];
  const dumbbellDefinitions=[
    {position:[-3.5,2.05,0.28],rotation:[0.12,-0.34,0.42],scale:0.72,phase:0.35,speed:0.48},
    {position:[-0.45,-2.15,0.32],rotation:[-0.18,0.52,-0.58],scale:0.78,phase:2.4,speed:0.4},
    {position:[1.68,1.72,0.24],rotation:[0.24,0.38,-0.32],scale:0.68,phase:4.55,speed:0.54},
  ];
  dumbbellDefinitions.forEach((definition,index)=>{
    const group=new THREE.Group();
    const accentMaterial=dumbbellMaterials[index];
    const handle=new THREE.Mesh(dumbbellHandleGeometry,index===1?limeWire:steelWire);
    handle.rotation.z=Math.PI/2;
    group.add(handle);

    for(let ridgeIndex=-4;ridgeIndex<=4;ridgeIndex+=1){
      const ridge=new THREE.Mesh(dumbbellKnurlGeometry,ridgeIndex%2===0?accentMaterial:steelWire);
      ridge.rotation.y=Math.PI/2;
      ridge.position.x=ridgeIndex*0.085;
      group.add(ridge);
    }

    for(const side of [-1,1]){
      const collar=new THREE.Mesh(dumbbellCollarGeometry,graphite);
      collar.rotation.z=Math.PI/2;
      collar.position.x=side*0.56;
      group.add(collar);

      const head=new THREE.Mesh(dumbbellHeadGeometry,accentMaterial);
      head.rotation.z=Math.PI/2;
      head.position.x=side*0.77;
      group.add(head);

      const cap=new THREE.Mesh(dumbbellCapGeometry,accentMaterial);
      cap.rotation.z=Math.PI/2;
      cap.position.x=side*0.98;
      group.add(cap);

      const ring=new THREE.Mesh(dumbbellRingGeometry,index===2?coralWire:index===1?limeWire:cyanWire);
      ring.rotation.y=Math.PI/2;
      ring.position.x=side*1.01;
      group.add(ring);
    }

    group.position.set(...definition.position);
    group.rotation.set(...definition.rotation);
    group.scale.setScalar(definition.scale);
    root.add(group);
    floatingDumbbells.push({
      group,
      basePosition:group.position.clone(),
      baseRotation:group.rotation.clone(),
      phase:definition.phase,
      speed:definition.speed,
      index,
    });
  });

  const pathColors=[COLORS.cyan,COLORS.lime,COLORS.white];
  for(let index=0;index<3;index+=1){
    const direction=index===1?-1:1;
    const amplitude=0.28+(index*0.16);
    const curve=new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.18,0,0),
      new THREE.Vector3(-1.6,amplitude*direction,-0.2+(index*0.18)),
      new THREE.Vector3(0,-amplitude*0.56,index===2?0.34:-0.12),
      new THREE.Vector3(1.6,amplitude*-direction,0.2-(index*0.14)),
      new THREE.Vector3(3.18,0,0),
    ]);
    const pathGeometry=geometry(new THREE.TubeGeometry(curve,budget.tier==="compact"?48:82,0.012+(index*0.004),5,false));
    const pathMaterial=meshMaterial(pathColors[index],0.42+(index*0.1));
    const pathMesh=new THREE.Mesh(pathGeometry,pathMaterial);
    root.add(pathMesh);
    loadPaths.push({mesh:pathMesh,curve,material:pathMaterial,index});

    const pulseGeometry=geometry(new THREE.SphereGeometry(0.055+(index*0.012),12,8));
    const pulseMaterial=meshMaterial(pathColors[index],0.95);
    const pulse=new THREE.Mesh(pulseGeometry,pulseMaterial);
    root.add(pulse);
    forcePulses.push({mesh:pulse,curve,material:pulseMaterial,offset:index/3,speed:0.11+(index*0.018)});
  }

  const ghostShaftGeometry=geometry(new THREE.CylinderGeometry(0.055,0.055,6.45,10));
  const ghostRimGeometry=geometry(new THREE.TorusGeometry(1.06,0.012,4,42));
  for(let index=0;index<budget.ghostCount;index+=1){
    const ghostMaterial=meshMaterial(index%2===0?COLORS.cyan:COLORS.lime,0.09+(index*0.025),true);
    const ghost=new THREE.Group();
    const ghostShaft=new THREE.Mesh(ghostShaftGeometry,ghostMaterial);
    ghostShaft.rotation.z=Math.PI/2;
    ghost.add(ghostShaft);
    for(const side of [-1,1]){
      const ghostPlate=new THREE.Mesh(ghostRimGeometry,ghostMaterial);
      ghostPlate.rotation.y=Math.PI/2;
      ghostPlate.position.x=side*3.02;
      ghost.add(ghostPlate);
    }
    ghost.position.z=-0.48-(index*0.34);
    ghost.position.y=(index-1)*0.12;
    root.add(ghost);
    ghosts.push({group:ghost,material:ghostMaterial,index});
  }

  const particlePositions=new Float32Array(budget.particles*3);
  for(let index=0;index<budget.particles;index+=1){
    const angle=index*2.3999632297;
    const radius=1.45+((index%37)*0.102);
    particlePositions[index*3]=Math.cos(angle)*radius;
    particlePositions[(index*3)+1]=Math.sin(angle)*radius*0.56;
    particlePositions[(index*3)+2]=((index%29)-14)*0.085;
  }
  const particleGeometry=geometry(new THREE.BufferGeometry());
  particleGeometry.setAttribute("position",new THREE.BufferAttribute(particlePositions,3));
  const particleMaterial=material(new THREE.PointsMaterial({
    color:COLORS.cyan,
    size:budget.tier==="compact"?0.026:0.034,
    transparent:true,
    opacity:0.5,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
  }));
  const particleCloud=new THREE.Points(particleGeometry,particleMaterial);
  root.add(particleCloud);
  particles.push(particleCloud);

  const bracketPositions=[];
  for(const side of [-1,1]){
    const x=side*3.85;
    bracketPositions.push(
      x,-1.35,0,x,1.35,0,
      x,-1.35,0,x-(side*0.32),-1.35,0,
      x,1.35,0,x-(side*0.32),1.35,0,
    );
  }
  for(let tick=-3;tick<=3;tick+=1){
    bracketPositions.push(tick,-1.55,0,tick,-1.44,0);
  }
  const measurementGeometry=geometry(new THREE.BufferGeometry());
  measurementGeometry.setAttribute("position",new THREE.Float32BufferAttribute(bracketPositions,3));
  const measurementLine=new THREE.LineSegments(measurementGeometry,coralLine);
  root.add(measurementLine);
  measurementBrackets.push(measurementLine);

  const coreGeometry=geometry(new THREE.OctahedronGeometry(0.19,1));
  const core=new THREE.Mesh(coreGeometry,coralWire);
  root.add(core);

  return {
    root,
    geometries,
    materials,
    handles:{
      shaft,
      knurl,
      plateStacks,
      plateRims,
      plateGrooves,
      hubBolts,
      collarRidges,
      progressRings,
      loadPaths,
      forcePulses,
      ghosts,
      particles,
      measurementBrackets,
      floatingDumbbells,
      core,
    },
  };
}
