const express=require("express")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const asyncHandler=require("express-async-handler")
const User = require("../models/userModel")
const Tool = require("../models/toolModel")
const Client = require("../models/clientsModel")
const userController={
    // assuming asyncHandler is already used
register: asyncHandler(async (req, res) => {
const { clickupId, email, name, password, role, emp_id, doj, rate } = req.body;
  let toolsInput = req.body.tools; // expected: array of strings or array of { toolName, url, icon, description }
  const coverFile = req.files?.coverImage?.[0];
  const idCardFile = req.files?.idCard?.[0];
  // const dpFile = req.files?.dp?.[0];

  const getUrlFromFile = (f) =>
    f?.path || f?.secure_url || f?.url || f?.location || f?.publicUrl || null;

  const coverImageUrl = getUrlFromFile(coverFile);
  const idCardUrl = getUrlFromFile(idCardFile);
  // const dpUrl = getUrlFromFile(dpFile);

  if (!clickupId || !email || !name || !password || !role || !doj) {
    res.status(400);
    throw new Error('clickupId, email, name and password are required');
  }

  if (!coverImageUrl || !idCardUrl) {
    res.status(400);
    throw new Error('coverImage and idCard files are required');
  }

  const userExists = await User.findOne({ clickupId });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Normalize toolsInput into an array
  if (!toolsInput) {
    toolsInput = [];
  } else if (typeof toolsInput === 'string') {
    // If client sent JSON serialized array as string, try to parse it; otherwise treat as single tool name
    try {
      const parsed = JSON.parse(toolsInput);
      toolsInput = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      // not JSON - treat as single tool name string
      toolsInput = [toolsInput];
    }
  } else if (!Array.isArray(toolsInput)) {
    toolsInput = [toolsInput];
  }

  // helper to extract toolName and other optional props
  const normalizeTool = (t) => {
    if (!t) return null;
    if (typeof t === 'string') {
      return { toolName: t.trim() };
    }
    // object expected to have toolName (or name)
    const toolName = (t.toolName || t.name || '').trim();
    if (!toolName) return null;
    return {
      toolName,
      url: t.url || t.link || t.url || undefined,
      icon: t.icon || undefined,
      description: t.description || undefined,
    };
  };

  // Build array of normalized tools and dedupe by case-insensitive toolName
  const normalized = toolsInput
    .map(normalizeTool)
    .filter(Boolean);

  // Deduplicate incoming toolNames (case-insensitive)
  const seen = new Set();
  const dedupedTools = [];
  for (const t of normalized) {
    const key = t.toolName.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      dedupedTools.push(t);
    }
  }

  // Process tools: find existing or create new ones
  const toolIds = await Promise.all(
    dedupedTools.map(async (t) => {
      // Case-insensitive search for existing tool
      const existing = await Tool.findOne({ toolName: { $regex: `^${escapeRegExp(t.toolName)}$`, $options: 'i' } });
      if (existing) return existing._id;

      // Not found -> create new tool
      try {
        const created = await Tool.create({
          toolName: t.toolName,
          url: t.url,
          icon: t.icon,
          description: t.description,
        });
        return created._id;
      } catch (err) {
        // If there's a duplicate key error because of concurrent creates, try to find again
        if (err.code === 11000) {
          const retry = await Tool.findOne({ toolName: { $regex: `^${escapeRegExp(t.toolName)}$`, $options: 'i' } });
          if (retry) return retry._id;
        }
        throw err;
      }
    })
  );

  const hashed_password = await bcrypt.hash(password, 10);
  const now = new Date();
  const joinDate = new Date(doj);

  let years = now.getFullYear() - joinDate.getFullYear();
  let months = now.getMonth() - joinDate.getMonth();
  let days = now.getDate() - joinDate.getDate();

  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const exp = `${years}.${months}`;

  const userCreated = await User.create({
    clickupId,
    email,
    rate,
    role,
    name,
    emp_id,
    doj,
    password: hashed_password,
    coverImage: coverImageUrl,
    idCard: idCardUrl,
    exp,
    tools: toolIds, // set references to Tool ids
  });

  if (!userCreated) {
    res.status(500);
    throw new Error('User creation failed');
  }

  const payload = {
    email: userCreated.email,
    id: userCreated._id || userCreated.id,
    name: userCreated.name,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '2d' });

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    maxAge: 2 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: !!isProd,
    sameSite: isProd ? 'none' : 'lax',
  });

  res.status(201).json({
    message: 'User created successfully',
    user: { id: userCreated._id || userCreated.id, email: userCreated.email, name: userCreated.name },
  });
}),
    login:asyncHandler(async(req,res)=>{
        const {clickupId,password}=req.body
        const userExist=await User.findOne({clickupId})
        if(!userExist){
            throw new Error("User not found")
        }
        const passwordMatch= bcrypt.compare(userExist.password,password)
        if(!passwordMatch){
            throw new Error("Passwords not matching")
        }
        const payload={
            clickupId:userExist.clickupId,
            id:userExist.id
        }
        const token=jwt.sign(payload,process.env.JWT_SECRET_KEY)
        res.cookie("token",token,{
            maxAge:2*24*60*60*1000,
            sameSite:"none",
            http:true,
            secure:false
        })
        res.send("Login successful")
    }),
    logout:asyncHandler(async(req,res)=>{
        res.clearCookie("token")
        res.send("User logged out")
    }),    
    getUsers: asyncHandler(async (req, res) => {
  try {
    // Exclude users with these ClickUp IDs
    const clickupIds = [
      "68f61a22d488e95f18bd99f2",
      "68f619eed488e95f18bd99ef",
    ]; // add more if needed

    const users = await User.find(
      { clickupId: { $nin: clickupIds } }, 
      "name rating exp rate coverImage idCard tools role"
    )
      .populate({
        path: "tools",
        select: "toolName url icon description -_id", 
      })
      .lean()
      .exec();

    return res.send(users);
  } catch (err) {
    console.error("getAllUsersSummary error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
}),

updateTool: asyncHandler(async (req, res) => {
  try {
    const { userId, tools } = req.body;

    if (!userId || !tools || !Array.isArray(tools)) {
      return res.status(400).json({
        success: false,
        message: "userId and tools[] are required",
      });
    }

    const toolIds = [];

    for (const toolData of tools) {
      const { toolName, url, icon, description } = toolData;

      if (!toolName || !url) {
        return res.status(400).json({
          success: false,
          message: "toolName and url are required for each tool",
        });
      }

      // Check if tool already exists (based on name + url)
      let tool = await Tool.findOne({ toolName, url });

      if (!tool) {
        tool = await Tool.create({
          toolName,
          url,
          icon: icon || "",
          description: description || "",
        });
      }

      toolIds.push(tool._id);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { tools: toolIds }, // replace current tools
      { new: true }
    ).populate("tools");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tools saved & assigned successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating tools", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}),

updateClient: asyncHandler(async (req, res) => {
  try {
    const { userId, clients } = req.body;

    if (!userId || !Array.isArray(clients)) {
      return res.status(400).json({
        success: false,
        message: "userId and clients[] are required",
      });
    }

    const clientIds = [];

    for (const clientData of clients) {
      const { name, companyName, email, phone, website, logo, status, notes } = clientData || {};
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Client name is required for each client",
        });
      }

      // identify existing client by email OR website OR name (in that order)
      const idQuery = {
        $or: [
          email ? { email } : null,
          website ? { website } : null,
          { name }
        ].filter(Boolean)
      };

      // upsert to avoid duplicates in Client collection and to update provided fields
      const client = await Client.findOneAndUpdate(
        idQuery,
        {
          $set: {
            name,
            companyName: companyName ?? "",
            email: email ?? "",
            phone: phone ?? "",
            website: website ?? "",
            logo: logo ?? "",
            notes: notes ?? "",
            status: status ?? "active",
          }
        },
        { new: true, upsert: true }
      );

      clientIds.push(client._id);
    }

    // dedupe incoming IDs before adding
    const uniqueIds = [...new Set(clientIds.map(String))];

    // append without duplicating existing entries
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { clients: { $each: uniqueIds } } },
      { new: true }
    ).populate("clients");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Clients added (skipping duplicates) and assigned successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating clients", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}),



}
module.exports=userController
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
