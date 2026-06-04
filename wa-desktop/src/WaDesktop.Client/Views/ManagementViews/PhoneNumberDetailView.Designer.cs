namespace WaDesktop.Client.Views.ManagementViews
{
    partial class PhoneNumberDetailView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.PictureBox picProfile;
        private System.Windows.Forms.Button btnUploadPhoto;
        private System.Windows.Forms.Button btnFetchMeta;
        private System.Windows.Forms.Label lblPhoneId;
        private System.Windows.Forms.Label lblQuality;
        private System.Windows.Forms.TextBox txtDisplayName;
        private System.Windows.Forms.TextBox txtDescription;
        private System.Windows.Forms.ComboBox cboCompany;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.TextBox txtPhoneId;
        private System.Windows.Forms.TextBox txtQuality;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.picProfile = new System.Windows.Forms.PictureBox();
            this.btnUploadPhoto = new System.Windows.Forms.Button();
            this.btnFetchMeta = new System.Windows.Forms.Button();
            this.lblPhoneId = new System.Windows.Forms.Label();
            this.lblQuality = new System.Windows.Forms.Label();
            this.txtDisplayName = new System.Windows.Forms.TextBox();
            this.txtDescription = new System.Windows.Forms.TextBox();
            this.cboCompany = new System.Windows.Forms.ComboBox();
            this.btnSave = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.txtPhoneId = new System.Windows.Forms.TextBox();
            this.txtQuality = new System.Windows.Forms.TextBox();
            ((System.ComponentModel.ISupportInitialize)(this.picProfile)).BeginInit();
            this.SuspendLayout();

            // picProfile
            this.picProfile.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.picProfile.Location = new System.Drawing.Point(20, 20);
            this.picProfile.Name = "picProfile";
            this.picProfile.Size = new System.Drawing.Size(120, 120);
            this.picProfile.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.picProfile.TabIndex = 0;
            this.picProfile.TabStop = false;

            // btnUploadPhoto
            this.btnUploadPhoto.Location = new System.Drawing.Point(20, 150);
            this.btnUploadPhoto.Name = "btnUploadPhoto";
            this.btnUploadPhoto.Size = new System.Drawing.Size(120, 28);
            this.btnUploadPhoto.TabIndex = 1;
            this.btnUploadPhoto.Text = "Upload Photo";
            this.btnUploadPhoto.UseVisualStyleBackColor = true;
            this.btnUploadPhoto.Click += new System.EventHandler(this.BtnUploadPhoto_Click);

            // btnFetchMeta
            this.btnFetchMeta.Location = new System.Drawing.Point(20, 184);
            this.btnFetchMeta.Name = "btnFetchMeta";
            this.btnFetchMeta.Size = new System.Drawing.Size(120, 28);
            this.btnFetchMeta.TabIndex = 2;
            this.btnFetchMeta.Text = "Fetch from Meta";
            this.btnFetchMeta.UseVisualStyleBackColor = true;
            this.btnFetchMeta.Click += new System.EventHandler(this.BtnFetchMeta_Click);

            // label1
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(160, 24);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(88, 13);
            this.label1.TabIndex = 3;
            this.label1.Text = "Phone Number ID";

            // txtPhoneId
            this.txtPhoneId.Location = new System.Drawing.Point(160, 40);
            this.txtPhoneId.Name = "txtPhoneId";
            this.txtPhoneId.ReadOnly = true;
            this.txtPhoneId.Size = new System.Drawing.Size(260, 22);
            this.txtPhoneId.TabIndex = 4;

            // label2
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(160, 68);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(72, 13);
            this.label2.TabIndex = 5;
            this.label2.Text = "Display Name";

            // txtDisplayName
            this.txtDisplayName.Location = new System.Drawing.Point(160, 84);
            this.txtDisplayName.Name = "txtDisplayName";
            this.txtDisplayName.Size = new System.Drawing.Size(260, 22);
            this.txtDisplayName.TabIndex = 6;

            // label3
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(160, 112);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(62, 13);
            this.label3.TabIndex = 7;
            this.label3.Text = "Description";

            // txtDescription
            this.txtDescription.Location = new System.Drawing.Point(160, 128);
            this.txtDescription.Multiline = true;
            this.txtDescription.Name = "txtDescription";
            this.txtDescription.Size = new System.Drawing.Size(260, 56);
            this.txtDescription.TabIndex = 8;

            // label4
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(160, 198);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(54, 13);
            this.label4.TabIndex = 9;
            this.label4.Text = "Company";

            // cboCompany
            this.cboCompany.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cboCompany.Location = new System.Drawing.Point(160, 214);
            this.cboCompany.Name = "cboCompany";
            this.cboCompany.Size = new System.Drawing.Size(260, 21);
            this.cboCompany.TabIndex = 10;

            // label5
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(160, 252);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(73, 13);
            this.label5.TabIndex = 11;
            this.label5.Text = "Quality Rating";

            // txtQuality
            this.txtQuality.Location = new System.Drawing.Point(160, 268);
            this.txtQuality.Name = "txtQuality";
            this.txtQuality.ReadOnly = true;
            this.txtQuality.Size = new System.Drawing.Size(260, 22);
            this.txtQuality.TabIndex = 12;

            // btnSave
            this.btnSave.BackColor = System.Drawing.Color.FromArgb(7, 94, 84);
            this.btnSave.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSave.ForeColor = System.Drawing.Color.White;
            this.btnSave.Location = new System.Drawing.Point(160, 310);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(120, 32);
            this.btnSave.TabIndex = 13;
            this.btnSave.Text = "Save Changes";
            this.btnSave.UseVisualStyleBackColor = false;
            this.btnSave.Click += new System.EventHandler(this.BtnSave_Click);

            // PhoneNumberDetailView
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.Controls.Add(this.btnSave);
            this.Controls.Add(this.txtQuality);
            this.Controls.Add(this.label5);
            this.Controls.Add(this.cboCompany);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.txtDescription);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.txtDisplayName);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.txtPhoneId);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.btnFetchMeta);
            this.Controls.Add(this.btnUploadPhoto);
            this.Controls.Add(this.picProfile);
            this.Name = "PhoneNumberDetailView";
            this.Size = new System.Drawing.Size(460, 360);
            ((System.ComponentModel.ISupportInitialize)(this.picProfile)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();
        }
    }
}
