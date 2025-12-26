const express=require("express")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const asyncHandler=require("express-async-handler")
const User = require("../models/userModel")
const Tool = require("../models/toolModel")
const Client = require("../models/clientsModel")
// helper to get upload URL from multer/cloudinary file object
function getUrlFromFile(f) {
  return f?.path || f?.secure_url || f?.url || f?.location || f?.publicUrl || null;
}
const userController={
register: asyncHandler(async (req, res) => {
  const { clickupId, email, name, password, role, emp_id, doj, rate, phone, isEmployee } = req.body;
  console.log("🔍 Register attempt with email:", email);
  
  if (email) {
    const emailExists = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    
    console.log("✅ Email check result:", emailExists);

    if (emailExists) {
      res.status(400);
      throw new Error("Email already exists");
    }
  }

  // ✅ FIX: Only check clickupId if it's provided (not undefined)
  if (clickupId) {
    const userExists = await User.findOne({ clickupId });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }
  }

  // ✅ FIX: Parse tools from JSON string
  let toolsInput = req.body.tools;
  console.log("Raw tools from req.body:", toolsInput, typeof toolsInput);

  // If it's a JSON string, parse it
  if (typeof toolsInput === 'string') {
    try {
      toolsInput = JSON.parse(toolsInput);
      console.log("Parsed tools:", toolsInput);
    } catch (err) {
      console.error("Failed to parse tools JSON:", err.message);
      toolsInput = [];
    }
  }

  // Ensure it's an array
  if (!Array.isArray(toolsInput)) {
    toolsInput = toolsInput ? [toolsInput] : [];
  }

  console.log("Final toolsInput after parsing:", toolsInput);

  const coverFile = req.files?.coverImage?.[0];
  const idCardFile = req.files?.idCard?.[0];

  const coverImageUrl = getUrlFromFile(coverFile);
  const idCardUrl = getUrlFromFile(idCardFile);

  // ✅ Normalize tools helper
  const normalizeTool = (t) => {
    if (!t || typeof t !== "object") return null;

    const toolName = typeof t.toolName === "string" ? t.toolName.trim() : "";

    if (!toolName) return null;

    return {
      toolName,
      url: t.url ? t.url.trim() : undefined,
      icon: t.icon || undefined,
      description: t.description ? t.description.trim() : undefined,
    };
  };

  // Build array of normalized tools and dedupe by case-insensitive toolName
  const normalized = toolsInput
    .map(normalizeTool)
    .filter(Boolean);

  console.log("Normalized tools:", normalized);

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

  console.log("Deduped tools:", dedupedTools);

  // ✅ Map uploaded toolIcons files to tools by array order
  const toolFiles = req.files?.toolIcons || [];
  console.log("Uploaded tool icon files count:", toolFiles.length);

  for (let i = 0; i < dedupedTools.length; i++) {
    const t = dedupedTools[i];
    if (!t.icon && toolFiles[i]) {
      const iconUrl = getUrlFromFile(toolFiles[i]);
      if (iconUrl) {
        t.icon = iconUrl;
        console.log(`Mapped uploaded icon for tool ${i} (${t.toolName}):`, iconUrl);
      }
    }
  }

  const toolIds = await Promise.all(
    dedupedTools.map(async (t) => {
      const existing = await Tool.findOne({
        toolName: { $regex: `^${escapeRegExp(t.toolName)}$`, $options: 'i' }
      });

      if (existing) {
        console.log(`Tool "${t.toolName}" already exists. Updating if needed...`);
        let changed = false;
        if (t.url && existing.url !== t.url) { existing.url = t.url; changed = true; }
        if (t.icon && existing.icon !== t.icon) { existing.icon = t.icon; changed = true; console.log(`  - Updated icon to: ${t.icon}`); }
        if (t.description && existing.description !== t.description) { existing.description = t.description; changed = true; }
        if (changed) await existing.save();
        return existing._id;
      }

      try {
        console.log(`Creating new tool: ${t.toolName}`, { url: t.url, icon: t.icon, description: t.description });
        const created = await Tool.create({
          toolName: t.toolName,
          url: t.url,
          icon: t.icon,
          description: t.description,
        });
        console.log(`Created tool ${t.toolName} with ID: ${created._id}, icon: ${created.icon}`);
        return created._id;
      } catch (err) {
        if (err.code === 11000) {
          const retry = await Tool.findOne({
            toolName: { $regex: `^${escapeRegExp(t.toolName)}$`, $options: 'i' }
          });
          if (retry) return retry._id;
        }
        throw err;
      }
    })
  );

  console.log("Final toolIds to save:", toolIds);

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
    isEmployee,
    name,
    emp_id,
    doj,
    password: hashed_password,
    coverImage: coverImageUrl,
    idCard: idCardUrl,
    exp,
    tools: toolIds,
  });

  if (!userCreated) {
    res.status(500);
    throw new Error('User creation failed');
  }

  console.log("User created with tools:", userCreated);

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
// login: asyncHandler(async (req, res) => {
//   const { email, clickupId, password } = req.body;

//   // 🔹 allow login via email OR clickupId
//   const userExist = await User.findOne({
//     $or: [
//       email ? { email: email.toLowerCase().trim() } : null,
//       clickupId ? { clickupId } : null,
//     ].filter(Boolean),
//   });

//   if (!userExist) {
//     res.status(400);
//     throw new Error("User not found");
//   }

//   const passwordMatch = await bcrypt.compare(password, userExist.password);
//   if (!passwordMatch) {
//     res.status(400);
//     throw new Error("Invalid credentials");
//   }

//   const payload = {
//     id: userExist._id,
//     email: userExist.email,
//     clickupId: userExist.clickupId,
//   };

//   const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
//     expiresIn: "2d",
//   });

//   res.cookie("token", token, {
//     maxAge: 2 * 24 * 60 * 60 * 1000,
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//   });

// }),
// 

login: asyncHandler(async (req, res) => {
  const { email, clickupId, password } = req.body;

  const userExist = await User.findOne({
    $or: [
      email ? { email: email.toLowerCase().trim() } : null,
      clickupId ? { clickupId } : null,
    ].filter(Boolean),
  });

  if (!userExist) {
    res.status(400);
    throw new Error("User not found");
  }

  const passwordMatch = await bcrypt.compare(password, userExist.password);
  if (!passwordMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // 🔐 ROLE & VERIFICATION CHECK - Fixed logic
  const isEmployee = userExist.role === "employee";
  const isVerified = userExist.verification === true; // Boolean comparison only

  const payload = {
    id: userExist._id,
    email: userExist.email,
    role: userExist.role,
    verification: userExist.verification,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  res.cookie("token", token, {
    maxAge: 2 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // ✅ SEND FLAGS TO FRONTEND
  res.json({
    message: "Login successful",
    token,
    user: {
      id: userExist._id,
      email: userExist.email,
      role: userExist.role,
      verification: userExist.verification,
      isEmployee,
      isVerified,
    },
  });
}),


    logout:asyncHandler(async(req,res)=>{
        res.clearCookie("token")
        res.send("User logged out")
    }),    

//   getUsers: asyncHandler(async (req, res) => {
//   try {
//     // Exclude users with these ClickUp IDs
//     const clickupIds = [
//       "68f61a22d488e95f18bd99f2",
//       "68f619eed488e95f18bd99ef",
//     ]; // add more if needed

// const users = await User.find(
//       { clickupId: { $nin: clickupIds } }, 
//       "name rating exp rate coverImage idCard tools role"
//     )
//       .populate({
//         path: "tools",
//         select: "toolName url icon description -_id", 
//       })
//       .lean()
//       .exec();

//     return res.send(users);
//   } catch (err) {
//     console.error("getAllUsersSummary error:", err);
//     return res
//       .status(500)
//       .json({ message: "Internal server error", error: err.message });
//   }
// }),

getUsers: asyncHandler(async (req, res) => {
  try {
    const users = await User.find(
      {}, 
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
    console.error("getUsers error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
}),

updateTool: asyncHandler(async (req, res) => {
  try {
    const { userId } = req.body;

    // tools may be sent as JSON string (from form-data) or as an array
    let toolsInput = req.body.tools;
    if (typeof toolsInput === 'string') {
      try {
        toolsInput = JSON.parse(toolsInput);
      } catch (err) {
        // fallback: keep as string -> wrap into array so validation below catches it
        toolsInput = toolsInput ? [toolsInput] : [];
      }
    }

    if (!userId || !toolsInput || !Array.isArray(toolsInput)) {
      return res.status(400).json({
        success: false,
        message: "userId and tools[] are required",
      });
    }

    // files uploaded via multer on this route (if any)
    const toolFiles = req.files?.toolIcons || [];

    const toolIds = [];

    for (let i = 0; i < toolsInput.length; i++) {
      const toolData = toolsInput[i] || {};
      const { toolName } = toolData;
      // url, icon, description optional in payload; icon can come from uploaded file
      const url = toolData.url || "";
      const description = toolData.description || "";

      // map uploaded files by order -> icon from payload takes precedence
      const uploadedFile = toolFiles[i];
      const iconUrl = toolData.icon || getUrlFromFile(uploadedFile) || "";

      if (!toolName) {
        return res.status(400).json({
          success: false,
          message: "toolName is required for each tool",
        });
      }

      // Case-insensitive search for an existing tool (match by name + url if provided)
      const query = { toolName: { $regex: `^${escapeRegExp(toolName)}$`, $options: 'i' } };
      if (url) query.url = url;

      let tool = await Tool.findOne(query);

      if (!tool) {
        tool = await Tool.create({
          toolName,
          url,
          icon: iconUrl,
          description,
        });
      } else if (iconUrl && (!tool.icon || tool.icon !== iconUrl)) {
        // update icon if a new uploaded icon was provided
        tool.icon = iconUrl;
        await tool.save();
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
